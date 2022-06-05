# Redis

Redis 是一套非常強大的記憶體資料庫，其中包括了 set, list, hash 這些大家在開發程式時常用的資料結構，其中有一個稱為 Sorted set (以下簡稱 zset) 的資料結構，剛好可以運用在 autocomplete 功能上。

顧名思義，zset 其實就是在儲存資料時，會將不重複的資料依照字典排序儲存起來。所以儲存 autocomplete 的資料時，可以直接將資料儲存進去，不用耗費額外的工作。 

## 寫入資料時

zset 在寫入資料時，可以要寫入的文字將每一個字切開，以「東京鐵塔」及「東京巨蛋球場」為例，可以切成以下的 token。

| 文字 | 結果 |
| ---- | ---------- |
| 東京鐵塔 | <ul><li>東</li><li>東京</li><li>東京鐵</li><li>東京鐵塔</li></ul> |
| 東京巨蛋球場 | <ul><li>東</li><li>東京</li><li>東京巨</li><li>東京巨蛋</li><li>東京巨蛋球</li><li>東京巨蛋球場</li></ul> |

然後使用 `ZADD` 的方式，將所有的 token 都寫入到 zset 裡面。

```sh
1. ZADD autocomplete_index 0 東
2. ZADD autocomplete_index 0 東京
3. ZADD autocomplete_index 0 東京鐵
4. ZADD autocomplete_index 0 東京鐵塔
5. ZADD autocomplete_index 0 東京鐵塔\x00 # <--- 真正需要搜尋到的結果
6. ZADD autocomplete_index 0 東 # <--- 資料重複，不會寫入成功
7. ZADD autocomplete_index 0 東京 # <--- 資料重複，不會寫入成功
8. ZADD autocomplete_index 0 東京巨
9. ZADD autocomplete_index 0 東京巨蛋
10. ZADD autocomplete_index 0 東京巨蛋球
11. ZADD autocomplete_index 0 東京巨蛋球場\x00 # <--- 真正需要搜尋到的結果
```

在寫入時，中間的 `0` 表示這一個資料的分數為 `0`，所以最後排序時會依照資料做字典排序 (lexicographic order)，也就是「先按照第一個字母以升冪排列，如果第一個字母一樣，那麼比較第二個、第三個到最後的字母。如果比到最後兩個單詞不一樣長，那麼把較短者排在前」。

其中第 5 及第 11 個指令，在最後方加入了 ASCII 碼的 `0x00`，也就是 `NULL` 的意思，這可以讓我們在讀取資料時使用。

## 讀取資料時

ES 的讀取資料其實就是搜尋 (search) 階段，利用索引所寫入的內容做搜尋，而此處因為索引已經使用 edge-ngram 的方式將 token 寫入，所以只要輸入時的關鍵字有任何一個符合 token 就會找到內容。

```json
{
  "query": {
    "bool": {
      "filter": [
        {
          "term": {
            "name": "東京"
          }
        }
      ]
    }
  }
}
```

搜尋時使用 `keyword` analyzer + `filter`，`keyword` analyzer 表示不會針對所輸入的關鍵字做切詞，但因為索引已經儲存了所有 edge-ngram 的 token，所以輸入「東京」的話，會找到「東京鐵塔」及「東京巨蛋球場」，而輸入「東京巨」的話，只會找到「東京巨蛋球場」。

而使用 `filter` 可以讓 ES 有 cache 的機會，因為 ES 的 filter 機制不會算分 (score)，所以只要使用者一直搜尋「東京」的話，可以加速搜尋結果的產生，因為此時會將結果存在記憶體裡面，而不用再重新搜尋。

### 依照字母長度排序

```json
{
  "query": {
    "bool": {
      "filter": [
        {
          "term": {
            "name": "東京"
          }
        }
      ]
    }
  },
  "sort": {
    "_script": {
      "script": "doc['name'].value.length()",
      "type": "number",
      "order": "asc"
    }
  }
}
```

此處要利用 painless script 算出文字的長度，並且做升冪 (asc) 排序。

### 依照使用頻率排序

```json
{
  "query": {
    "bool": {
      "filter": [
        {
          "term": {
            "name": "東京"
          }
        }
      ]
    }
  },
  "sort": [
    {
      "pageview": {
        "order": "asc"
      }
    }
  ]
}
```

如果原本內容就有儲存使用頻率 (此處為 `pageview`) 的話，可以直接利用 ES 的 sort 語法做排序，不需另外處理。