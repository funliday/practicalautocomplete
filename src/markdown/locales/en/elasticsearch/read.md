## Read data

Reading data stage is the search stage of Elasticsearch. The index already wrote all tokens via edge-ngram, so keyword would match any token in the index data.

```js
// GET /autocomplete_index/_search
{
  "query": {
    "bool": {
      "filter": [
        {
          "term": {
            "name": "a bl"
          }
        }
      ]
    }
  }
}
```

It will use `keyword` analyzer and `filter` when searching keyword, `keyword` analyzer is not to tokenize the keyword. If user press `a bl` will find `a black horse`, and press `a wh` will find `a white house`.

And `filter` can cache results because `filter` can't calculate score. If user always search `a bl`, will speed up the search results, because the results store the memory.

### Sort by character length

```js
// GET /autocomplete_index/_search
{
  "query": {
    "bool": {
      "filter": [
        {
          "term": {
            "name": "a bl"
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

Use painless script to calculate the word length, and sort by ascending.

### Sort by frequency

```js
// GET /autocomplete_index/_search
{
  "query": {
    "bool": {
      "filter": [
        {
          "term": {
            "name": "a bl"
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

If original data store frequency (`pageview` in here), can use Elasticsearch sort syntax easily.