# Redis

Redis 是一套非常強大的記憶體資料庫，其中包括了 Set, List, Hash 這些大家在開發程式時常用的資料結構，其中有一個稱為 Sorted set 的資料結構，剛好可以運用在 autocomplete 功能上。

顧名思義，Sorted set 其實就是在儲存資料時，會將不重複的資料依照字典排序儲存起來。所以儲存 autocomplete 的資料時，可以直接將資料儲存進去，不用耗費額外的工作。 

## 寫入資料時

Sorted set 在寫入資料時，可以要寫入的文字將每一個字切開，以「東京鐵塔」及「東京巨蛋球場」為例，可以切成以下的 token。

| 文字 | 結果 |
| ---- | ---------- |
| 東京鐵塔 | <ul><li>東</li><li>東京</li><li>東京鐵</li><li>東京鐵塔</li></ul> |
| 東京巨蛋球場 | <ul><li>東</li><li>東京</li><li>東京巨</li><li>東京巨蛋</li><li>東京巨蛋球</li><li>東京巨蛋球場</li></ul> |

然後使用 `ZADD` 的方式寫入資料

```sh
ZADD autocomplete_index 0 東
ZADD autocomplete_index 0 東京
ZADD autocomplete_index 0 東京鐵
ZADD autocomplete_index 0 東京鐵塔
ZADD autocomplete_index 0 東京鐵塔*
ZADD autocomplete_index 0 東
ZADD autocomplete_index 0 東京
ZADD autocomplete_index 0 東京巨
ZADD autocomplete_index 0 東京巨蛋
ZADD autocomplete_index 0 東京巨蛋球
ZADD autocomplete_index 0 東京巨蛋球場*
```

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