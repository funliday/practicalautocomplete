# Elasticsearch

Elasticsearch (以下簡稱 ES) 是一套非常強大的搜尋引擎，而搜尋最重要的就是在於切詞，所以 ES 內建許多切詞器 (analyzer)，其中 edge-ngram analyzer 非常適合用在 autocomplete 功能上。

edge-ngram analyzer 會將所輸入的文字，從頭到尾利用 ngram 的方式將文字切詞。以「台北101」為例，會切成「台」、「台北」、「台北1」、「台北10」、「台北101」共五個 token。而 autocomplete 原理與 edge-ngram 相同，都是會從頭切到尾，所以 ES 很適合將 edge-ngram 運用在 autocomplete 功能上。

## 寫入資料時

ES 的寫入資料其實就是索引 (index) 階段，此處的 Settings 和 Mappings 設定很重要，會關係到讀取資料時的方式。

### Settings

```json
{
  "settings": {
    "analysis": {
      "tokenizer": {
        "autocomplete_tokenizer": {
          "type": "edge_ngram",
          "min_gram": 1,
          "max_gram": 20
        }
      },
      "analyzer": {
        "autocomplete_analyzer": {
          "tokenizer": "autocomplete_tokenizer"
        }
      }
    }
  }
}
```

此處表示自訂一個 ES 的 analyzer (`autocomplete_analyzer`)，而這個 analyzer 有一個自訂的 tokenizer (`autocomplete_tokenizer`)，其中 type 為 `edge_ngram`，並設定最小長度 (`min_gram`) 為 `1`，最大長度 (`max_gram`) 為 `20`。這樣設定的用意在於一般使用者輸入文字時，應該不會打到 20 個字這麼長，所以為了加速搜尋速度及減少硬碟使用量，設定上限是一個不錯的選擇。

### Mappings

```json
{
  "mappings": {
    "properties": {
      "name": {
        "type": "text",
        "analyzer": "autocomplete_analyzer",
        "search_analyzer": "keyword"
      }
    }
  }
}
```

在欄位 mapping 時，將需要做 autocomplete 的欄位 (此處為 `name`) 設定索引時的 analyzer 為 `autocomplete_analyzer`，所以以「東京鐵塔」及「東京巨蛋球場」為例，使用一般中文切詞 (如 ik, jieba...等) 及 `autocomplete_analyzer` 會切成不同的 token。

所以「東京鐵塔」使用 `autocomplete_analyzer` 切詞後，有四個 token 可以對應到它。

| 文字 | 一般中文切詞可能的結果 | autocomplete_analyzer |
| ---- | ------- | ---------- |
| 東京鐵塔 | <ul><li>東京</li><li>鐵塔</li><li>東京鐵塔</li></ul>| <ul><li>東</li><li>東京</li><li>東京鐵</li><li>東京鐵塔</li></ul> |
| 東京巨蛋球場 | <ul><li>東京</li><li>巨蛋</li><li>球場</li><li>東京巨蛋</li><li>巨蛋球場</li><li>東京巨蛋球場</li></ul>| <ul><li>東</li><li>東京</li><li>東京巨</li><li>東京巨蛋</li><li>東京巨蛋球</li><li>東京巨蛋球場</li></ul> |

## 讀取資料時

ES 的讀取資料其實就是利用索引所寫入的內容做搜尋，而此處因為寫入索引時已經使用 edge-ngram 的方式將 token 寫入至索引，所以只要輸入時的關鍵字有任何一個符合 token 就會找到內容。

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

搜尋時使用 `keyword` analyzer + filter，`keyword` analyzer 表示不會針對所輸入的關鍵字做切詞，但因為索引已經儲存了所有 edge-ngram 的 token，所以輸入「東京」的話，會找到「東京鐵塔」及「東京巨蛋球場」，而輸入「東京巨」的話，只會找到「東京巨蛋球場」。

而使用 `filter` 可以讓 ES 有 cache 的機會，因為 ES 的 filter 機制不會算分 (score)，所以只要使用者一直搜尋「東京」的話，可以加速搜尋結果的產生，因為此時會將結果存在記憶體裡面，而不用再重新搜尋。