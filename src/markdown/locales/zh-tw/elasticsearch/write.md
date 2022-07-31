## 寫入資料時

ES 的寫入資料其實就是索引 (index) 階段，此處的 Settings 和 Mappings 設定很重要，會關係到讀取資料時的方式。

### Settings

```js
// PUT /autocomplete_index/_settings
{
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
```

此處表示自訂一個 ES 的 analyzer (`autocomplete_analyzer`)，而這個 analyzer 有一個自訂的 tokenizer (`autocomplete_tokenizer`)，其中 type 為 `edge_ngram`，並設定最小長度 (`min_gram`) 為 `1`，最大長度 (`max_gram`) 為 `20`。這樣設定的用意在於一般使用者輸入文字時，應該不會打到 20 個字這麼長，所以為了加速搜尋速度及減少硬碟使用量，設定上限是一個不錯的選擇。

### Mappings

```js
// PUT /autocomplete_index/_mapping
{
  "properties": {
    "name": {
      "type": "text",
      "analyzer": "autocomplete_analyzer",
      "search_analyzer": "keyword"
    }
  }
}
```

在欄位 mapping 時，將需要做 autocomplete 的欄位 (此處為 `name`) 設定索引時的 analyzer 為 `autocomplete_analyzer`，所以以「東京鐵塔」及「東京巨蛋球場」為例，使用一般中文切詞 (如 ik, jieba...等) 及 `autocomplete_analyzer` 會切成不同的 token。

所以「東京鐵塔」使用 `autocomplete_analyzer` 切詞後，有四個 token 可以對應到它。

<table class="table">
    <thead>
        <tr>
            <th>文字</th>
            <th>一般中文切詞可能的結果</th>
            <th>autocomplete_analyzer</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>東京鐵塔</td>
            <td>
                <ul>
                    <li>東京</li>
                    <li>鐵塔</li>
                    <li>東京鐵塔</li>
                </ul>
            </td>
            <td>
                <ul>
                    <li>東</li>
                    <li>東京</li>
                    <li>東京鐵</li>
                    <li>東京鐵塔</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>東京巨蛋球場</td>
            <td>
                <ul>
                    <li>東京</li>
                    <li>巨蛋</li>
                    <li>球場</li>
                    <li>東京巨蛋</li>
                    <li>巨蛋球場</li>
                    <li>東京巨蛋球場</li>
                </ul>
            </td>
            <td>
                <ul>
                    <li>東</li>
                    <li>東京</li>
                    <li>東京巨</li>
                    <li>東京巨蛋</li>
                    <li>東京巨蛋球</li>
                    <li>東京巨蛋球場</li>
                </ul>
            </td>
        </tr>
    </tbody>
</table>

而真正寫入索引的指令如下：

```js
// POST /autocomplete_index/_doc
{
  "name": "東京鐵塔"
}

// POST /autocomplete_index/_doc
{
  "name": "東京巨蛋球場"
}
```