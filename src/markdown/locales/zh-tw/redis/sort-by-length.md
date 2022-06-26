## 依照字母長度排序 - 簡單版

這個情境因為不用使用分數 (score)，所以可以使用簡單版的 zset 讀寫策略。

### 寫入資料時

我們可以使用 `ZADD` 的方式，將所有的 token 都寫入到 zset 裡面。

```sh
1. ZADD autocomplete_index 0 東
2. ZADD autocomplete_index 0 東京
3. ZADD autocomplete_index 0 東京鐵
4. ZADD autocomplete_index 0 東京鐵塔
5. ZADD autocomplete_index 0 東京鐵塔\x00
6. ZADD autocomplete_index 0 東 # <--- 資料重複，不會寫入成功
7. ZADD autocomplete_index 0 東京 # <--- 資料重複，不會寫入成功
8. ZADD autocomplete_index 0 東京巨
9. ZADD autocomplete_index 0 東京巨蛋
10. ZADD autocomplete_index 0 東京巨蛋球
11. ZADD autocomplete_index 0 東京巨蛋球場
12. ZADD autocomplete_index 0 東京巨蛋球場\x00
```

在寫入時，中間的 `0` 表示這一個資料的分數為 `0`，所以最後排序時會依照資料做字典排序 (lexicographic order)，也就是「先按照第一個字母以升冪排列，如果第一個字母一樣，那麼比較第二個、第三個到最後的字母。如果比到最後兩個單詞不一樣長，那麼把較短者排在前」，所以最後寫到 zset 的結果會變成下面這樣。

```sh
position = 0 => 東
position = 1 => 東京
position = 2 => 東京巨
position = 3 => 東京鐵
position = 4 => 東京巨蛋
position = 5 => 東京鐵塔
position = 6 => 東京鐵塔\x00 # <--- 真正需要搜尋到的結果
position = 7 => 東京巨蛋球
position = 8 => 東京巨蛋球場
position = 9 => 東京巨蛋球場\x00 # <--- 真正需要搜尋到的結果
```

其中 position 6 及 9，在最後方加入了 ASCII 碼的 `0x00`，也就是 `NULL` 的意思，這可以讓我們在讀取資料時使用。

### 讀取資料時

zset 在讀取資料時有兩個步驟，首先當使用者輸入「東京」時，需要先用 `ZRANK` 將資料取出位置 (position)，此處的結果為 `1`。

```sh
position = ZRANK autocomplete_index 東京
```

另外使用 `ZRANGE` 從位置 `1` 開始，往後取若干筆 (此處設定為 50 筆)，最後會取出 position 從 1 到 9 的內容，然後再將結尾有 `\x00` 的資料取出來，最後就可以輸出「東京鐵塔」及「東京巨蛋球場」了。而如果輸入「東京巨」的話，就可以找到「東京巨蛋球場」。

```sh
ZRANGE autocomplete_index 2 52 # <--- 2 為 1+1，52 為 1+1+50
```