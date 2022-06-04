# Elasticsearch

使用 edge-ngram 開發，相關 setting 及 mapping 如下

## Settings

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

## Mappings

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

寫入 index 時使用 edge-ngram 做切詞，並設定最小 gram 為 1，最大 gram 為 20，因為理論上使用者不會打超過 20 個字，所以為了減少儲存內容，所以設定最大 gram。

以「東京鐵塔」為例，使用一般中文切詞及 edge-ngram 會切成不同的 token

| 一般中文切詞 | edge-ngram |
| ------- | ---------- |
| <ul><li>東京</li><li>鐵塔</li><li>東京鐵塔</li></ul>| <ul><li>東</li><li>東京</li><li>東京鐵</li><li>東京鐵塔</li></ul> |

以「東京巨蛋球場」為例，使用一般中文切詞及 edge-ngram 會切成不同的 token

| 一般中文切詞 | edge-ngram |
| ------- | ---------- |
| <ul><li>東京</li><li>巨蛋</li><li>球場</li><li>東京巨蛋</li><li>巨蛋球場</li><li>東京巨蛋球場</li></ul>| <ul><li>東</li><li>東京</li><li>東京巨</li><li>東京巨蛋</li><li>東京巨蛋球</li><li>東京巨蛋球場</li></ul> |

在搜尋時使用 keyword analyzer，keyword analyzer 表示不會針對所輸入的關鍵字做切詞，所以搜尋時輸入「東京」的話，會找到「東京鐵塔」及「東京巨蛋球場」，而輸入「東京巨」的話，只會找到「東京巨蛋球場」