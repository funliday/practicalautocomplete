# Autocomplete 簡介

autocomplete 是現代軟體服務最重要的功能之一，使用者在輸入框輸入了文字，軟體服務就會回傳最適當的選項給使用者，而使用者可以依照回傳的各個選項中選擇其中一個執行動作。

## Autocomplete 原理

* Read times >>>>> write times
* 時間複雜度

## UI 的呈現方式

## 相關文章

* http://oldblog.antirez.com/post/autocomplete-with-redis.html
* https://redis.com/ebook/part-2-core-concepts/chapter-6-application-components-in-redis/6-1-autocomplete/6-1-1-autocomplete-for-recent-contacts/
* https://redis.com/ebook/part-2-core-concepts/chapter-6-application-components-in-redis/6-1-autocomplete/6-1-2-address-book-autocomplete/
* https://www.prefixbox.com/blog/autocomplete-search/
* https://zh.wikipedia.org/wiki/%E8%87%AA%E5%8A%A8%E5%AE%8C%E6%88%90

## Autocomplete 與 search suggestion 的差異

autocomplete 常與 search suggestion 交互使用，這裡將以 prefix 精準比對定義為 autocomplete，以中間的文字比對定義為 search suggestion。

## Elasticsearch

[詳細原理](./elasticsearch.html)

## Redis

[詳細原理](./redis.html)

## Elasticsearch 與 Redis 的比較

<table class="table">
    <thead>
        <tr>
            <th>比較項目</th>
            <th>Elasticsearch</th>
            <th>Redis</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <th>寫入時間</th>
            <td>沒比較過</td>
            <td>沒比較過</td>
        </tr>
        <tr>
            <th>讀取時間</th>
            <td>因為儲存在硬碟內，所以相同關鍵字的首次讀取一定比較慢，但讀取時是使用 filter 的方式，所以 Elasticsearch 會將 filtered 的資料儲存在記憶體內，以供後續相同關鍵字使用</td>
            <td>因為全都儲存在記憶體內，所以速度整體上一定比較快</td>
        </tr>
        <tr>
            <th>儲存空間</th>
            <td>在於 edge ngram 的 min ngram 及 max ngram</td>
            <td>如果是簡單版的字母排序，儲存量遠比複雜版的少許多</td>
        </tr>
        <tr>
            <th>儲存成本</th>
            <td>儲存在硬碟內，成本低</td>
            <td>儲存在記憶體內，成本高</td>
        </tr>
    </tbody>
</table>

### 總結

改用 es 的 edge ngram 來實作，要人工介入開發的工作少了很多，包括建 inverted index 跟分詞，最後有扯到 redis 的只剩 city 那一段

另外整體算下來，es 的儲存空間可能會比 redis 要多一些，但這不是我考量的點，因為 es 吃硬碟，redis 吃記憶體，昨天就是因為 redis 太貴而且爆掉，才移到 es。

另外雖然 es 是走硬碟，但因為 query 語法是用 filter，所以曾經被搜過的內容會存記憶體裡面，速度應該不會明顯下降。
