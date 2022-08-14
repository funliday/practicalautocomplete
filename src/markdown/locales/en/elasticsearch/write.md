## Write data

Writing data stage is the index stage of Elasticsearch, and `settings` and `mappings` are very important, they would be related to reading data.

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

There is a custom Elasticsearch analyzer `autocomplete_analyzer`, the analyer has one custom (type is `edge_ngram`) tokenizer `autocomplete_tokenizer`, and set `min_gram` is `1`, and `max_gram` is `20`. Limitation of ngram length that when user press keyword length would be less 20, so speed up query and save the hard disk usage, set limitation is a good choice.

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

When mapping the fields, it needs to set field (`name` in here) analyzer `autocomplete_analyzer`. For example `A black horse` and `A white house`, they are tokenized totally different in classic analyzer and `autocomplete_analyzer`.

<table class="table">
    <thead>
        <tr>
            <th>Word</th>
            <th>classic analyzer</th>
            <th>autocomplete_analyzer</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>A black horse</td>
            <td>
                <ul>
                    <li>a</li>
                    <li>black</li>
                    <li>horse</li>
                </ul>
            </td>
            <td>
                <ul>
                    <li>a</li>
                    <li>a&nbsp;</li>
                    <li>a&nbsp;b</li>
                    <li>a&nbsp;bl</li>
                    <li>a&nbsp;bla</li>
                    <li>a&nbsp;blac</li>
                    <li>a&nbsp;black</li>
                    <li>a&nbsp;black&nbsp;</li>
                    <li>a&nbsp;black&nbsp;h</li>
                    <li>a&nbsp;black&nbsp;ho</li>
                    <li>a&nbsp;black&nbsp;hor</li>
                    <li>a&nbsp;black&nbsp;hors</li>
                    <li>a&nbsp;black&nbsp;horse</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>A white house</td>
            <td>
                <ul>
                    <li>a</li>
                    <li>white</li>
                    <li>house</li>
                </ul>
            </td>
            <td>
                <ul>
                    <li>a</li>
                    <li>a&nbsp;</li>
                    <li>a&nbsp;w</li>
                    <li>a&nbsp;wh</li>
                    <li>a&nbsp;whi</li>
                    <li>a&nbsp;whit</li>
                    <li>a&nbsp;white</li>
                    <li>a&nbsp;white&nbsp;</li>
                    <li>a&nbsp;white&nbsp;h</li>
                    <li>a&nbsp;white&nbsp;ho</li>
                    <li>a&nbsp;white&nbsp;hou</li>
                    <li>a&nbsp;white&nbsp;hous</li>
                    <li>a&nbsp;white&nbsp;house</li>
                </ul>
            </td>
        </tr>
    </tbody>
</table>

Real writing index commands are

```js
// POST /autocomplete_index/_doc
{
  "name": "A black horse"
}

// POST /autocomplete_index/_doc
{
  "name": "A white house"
}
```