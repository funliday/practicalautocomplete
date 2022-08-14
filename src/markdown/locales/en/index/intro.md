# Intro

Autocomplete is one of the most important features for modern software development. When user presses some text at text field, software will return suitable options to user. And user can select someone to execute specify action.

## Principles

* Read times >>>>> write times

## References

* http://oldblog.antirez.com/post/autocomplete-with-redis.html
* https://redis.com/ebook/part-2-core-concepts/chapter-6-application-components-in-redis/6-1-autocomplete/6-1-1-autocomplete-for-recent-contacts/
* https://redis.com/ebook/part-2-core-concepts/chapter-6-application-components-in-redis/6-1-autocomplete/6-1-2-address-book-autocomplete/
* https://www.prefixbox.com/blog/autocomplete-search/
* https://zh.wikipedia.org/wiki/%E8%87%AA%E5%8A%A8%E5%AE%8C%E6%88%90

## Difference autocomplete with search suggestion

The two words always used alternately. Currently, autocomplete defines prefix match, and search suggestion defines any position match.

## Elasticsearch

[Detail](./elasticsearch.html)

## Redis

[Detail](./redis.html)

## Comparison between Elasticsearch and Redis

<table class="table">
    <thead>
        <tr>
            <th>Comparison</th>
            <th>Elasticsearch</th>
            <th>Redis</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <th>Write speed</th>
            <td>N/A</td>
            <td>N/A</td>
        </tr>
        <tr>
            <th>Read speed</th>
            <td>Because all data store at hard disk, the same keyword must read slowly at first time, and stores all results to memory. But read data faster since second time if the same keyword</td>
            <td>Because all data store at memory, the speed must faster than Elasticsearch overall</td>
        </tr>
        <tr>
            <th>Storage size</th>
            <td>Depends on edge-ngram's min and max ngram</td>
            <td>If sort by length, simple version more less than complicated version</td>
        </tr>
        <tr>
            <th>Storage cost</th>
            <td>Store at hard disk, low cost</td>
            <td>Store at memory, high cost</td>
        </tr>
    </tbody>
</table>

### Summary

1. Elasticsearch's edge-ngram tokenizer can improve many works, including create inverted index and tokenize.
2. Elasticsearch's storage size maybe more than Redis, because Elasticsearch store data at hard disk, Redis store data at memory.
3. Although Elasticsearch access data at hard disk, but query syntax will use filter clause. So old query results would store at memory, and query speed maybe not obvious slowly