# Elasticsearch

Elasticsearch (以下簡稱 ES) 是一套非常強大的搜尋引擎，而搜尋最重要的原理就是在於切詞，所以 ES 內建許多切詞器 (analyzer)，其中 edge-ngram analyzer 非常適合用在 autocomplete 功能上。

edge-ngram analyzer 會將所輸入的文字，從頭到尾利用 ngram 的方式將文字切詞。以「台北101」為例，會切成「台」、「台北」、「台北1」、「台北10」、「台北101」共五個 token。而 autocomplete 原理與 edge-ngram 相同，都是會從頭切到尾，所以 ES 很適合將 edge-ngram 運用在 autocomplete 功能上。