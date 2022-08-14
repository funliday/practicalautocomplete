# Elasticsearch

Elasticsearch is a powerful search engine, and the most important thing is tokenization. So Elasticsearch built in many analyzer (or tokenizer), edge-ngram is the one of many tokenizers that suits in autocomplete feature.

Edge-ngram analyzer will cut the whole word via ngram. For example, `house` will tokenize `h`, `ho`, `hou`, `hous`, `house` 5 tokens. Autocomplete also cut the whold word, so Elasticsearch and edge-ngrom analyzer very suitable at autocomplete feature.