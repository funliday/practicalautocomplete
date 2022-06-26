## 讀取資料時

ES 的讀取資料其實就是搜尋 (search) 階段，利用索引所寫入的內容做搜尋，而此處因為索引已經使用 edge-ngram 的方式將 token 寫入，所以只要輸入時的關鍵字有任何一個符合 token 就會找到內容。

```js
// GET /autocomplete_index/_search
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

```js
// GET /autocomplete_index/_search
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

```js
// GET /autocomplete_index/_search
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
        "order": "desc"
      }
    }
  ]
}
```

如果原本內容就有儲存使用頻率 (此處為 `pageview`) 的話，可以直接利用 ES 的 sort 語法做排序，不需另外處理。