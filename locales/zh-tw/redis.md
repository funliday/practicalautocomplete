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
5. ZADD autocomplete_index 0 東京鐵塔\x00
6. ZADD autocomplete_index 0 東 # <--- 資料重複，不會寫入成功
7. ZADD autocomplete_index 0 東京 # <--- 資料重複，不會寫入成功
8. ZADD autocomplete_index 0 東京巨
9. ZADD autocomplete_index 0 東京巨蛋
10. ZADD autocomplete_index 0 東京巨蛋球
11. ZADD autocomplete_index 0 東京巨蛋球場
12. ZADD autocomplete_index 0 東京巨蛋球場\x00
```

在寫入時，中間的 `0` 表示這一個資料的分數為 `0`，所以最後排序時會依照資料做字典排序 (lexicographic order)，也就是「先按照第一個字母以升冪排列，如果第一個字母一樣，那麼比較第二個、第三個到最後的字母。如果比到最後兩個單詞不一樣長，那麼把較短者排在前」，所以最後寫到 zset 的結果會變成下面這樣。

```sh
position = 0 => 東
position = 1 => 東京
position = 2 => 東京巨
position = 3 => 東京鐵
position = 4 => 東京巨蛋
position = 5 => 東京鐵塔
position = 6 => 東京鐵塔\x00 # <--- 真正需要搜尋到的結果
position = 7 => 東京巨蛋球
position = 8 => 東京巨蛋球場
position = 9 => 東京巨蛋球場\x00 # <--- 真正需要搜尋到的結果
```

其中 position 6 及 9，在最後方加入了 ASCII 碼的 `0x00`，也就是 `NULL` 的意思，這可以讓我們在讀取資料時使用。

## 讀取資料時

zset 在讀取資料時有兩個步驟，首先當使用者輸入「東京」時，需要先用 `ZRANK` 將資料取出位置 (position)，此處的結果為 `1`。

```sh
position = ZRANK autocomplete_index 東京
```

另外使用 `ZRANGE` 從位置 `1` 開始，往後取若干筆 (此處設定為 50 筆)，最後會取出 position 從 1 到 9 的內容，然後再將結尾有 `\x00` 的資料取出來，最後就可以輸出「東京鐵塔」及「東京巨蛋球場」了。而如果輸入「東京巨」的話，就可以找到「東京巨蛋球場」。

```sh
ZRANGE autocomplete_index 2 52 # <--- 2 為 1+1，52 為 1+1+50
```

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