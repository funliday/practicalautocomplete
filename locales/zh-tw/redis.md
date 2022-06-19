# Redis

Redis 是一套非常強大的記憶體資料庫，其中包括了 set, list, hash 這些大家在開發程式時常用的資料結構，其中有一個稱為 Sorted set (以下簡稱 zset) 的資料結構，剛好可以運用在 autocomplete 功能上。

顧名思義，zset 其實就是在儲存資料時，會將不重複的資料依照字典排序儲存起來。所以儲存 autocomplete 的資料時，可以直接將資料儲存進去，不用耗費額外的工作。

## 切 token

zset 在寫入資料時，先把要寫入的文字每一個字切開。以「東京鐵塔」及「東京巨蛋球場」為例，可以切成以下的 token。

| 文字 | 結果 |
| ---- | ---------- |
| 東京鐵塔 | <ul><li>東</li><li>東京</li><li>東京鐵</li><li>東京鐵塔</li></ul> |
| 東京巨蛋球場 | <ul><li>東</li><li>東京</li><li>東京巨</li><li>東京巨蛋</li><li>東京巨蛋球</li><li>東京巨蛋球場</li></ul> |

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

## 依照使用頻率排序 - 複雜版

這個情境因為有外部分數影響，所以我們必須要換另一種方式的 zset 讀寫策略。

### 寫入資料時

我們一樣是使用 `ZADD` 的方式，將所有的 token 都寫入到 zset 裡面。但此處因為有分數的關係，所以在寫入資料時可以把 index 的名稱加上 token，另外把分數加上去。

```sh
1. ZADD autocomplete_index:東 100 東京鐵塔
2. ZADD autocomplete_index:東京 100 東京鐵塔
3. ZADD autocomplete_index:東京鐵 100 東京鐵塔
4. ZADD autocomplete_index:東京鐵塔 100 東京鐵塔
5. ZADD autocomplete_index:東 240 東京巨蛋球場
6. ZADD autocomplete_index:東京 240 東京巨蛋球場
7. ZADD autocomplete_index:東京巨 240 東京巨蛋球場
8. ZADD autocomplete_index:東京巨蛋 240 東京巨蛋球場
9. ZADD autocomplete_index:東京巨蛋球 240 東京巨蛋球場
10. ZADD autocomplete_index:東京巨蛋球場 240 東京巨蛋球場
```

在寫入時，中間的 `100` 表示這一個資料的分數為 `100`，所以最後排序時會先依照資料的分數做升冪排列，如果分數一樣才做字典排序 (lexicographic order)，所以最後寫到 zset 的結果會變成下面這樣。

```sh
# autocomplete_index:東
autocomplete_index:東 100 東京鐵塔
autocomplete_index:東 240 東京巨蛋球場

# autocomplete_index:東京
autocomplete_index:東京 100 東京鐵塔
autocomplete_index:東京 240 東京巨蛋球場

# autocomplete_index:東京鐵
autocomplete_index:東京鐵 100 東京鐵塔

# autocomplete_index:東京鐵塔
autocomplete_index:東京鐵塔 100 東京鐵塔

# autocomplete_index:東京巨
autocomplete_index:東京巨 240 東京巨蛋球場

# autocomplete_index:東京巨蛋
autocomplete_index:東京巨蛋 240 東京巨蛋球場

# autocomplete_index:東京巨蛋球
autocomplete_index:東京巨蛋球 240 東京巨蛋球場

# autocomplete_index:東京巨蛋球場
autocomplete_index:東京巨蛋球場 240 東京巨蛋球場
```

### 讀取資料時

不需先使用 `ZRANK` 將資料定位，此處直接使用 `ZRANGE` 就可以取得資料了，但要注意必須要加上 `BYSCORE` 及 `REV` 兩個參數，表示必須使用分數 (`BYSCORE`) 做降冪排序 (`REV`)

```sh
ZRANGE autocomplete_index:東京 +INF -INF BYSCORE REV LIMIT 0 50
```

## 簡單版及複雜版的差異

無論是依照字母長度排序或是依照使用頻率排序，複雜版的資料結構都可以符合這兩種情境，但複雜版也有一些維護上的問題，這邊整理一個表格分別描述兩者的差異

|比較項目|簡單版|複雜版|
|---|-----|-----|
|寫入|寫入時的 value 除了每個關鍵字的 n-gram 之外，還要多加一個完整關鍵字加上分隔符號|寫入時的 Redis key 會加上每個關鍵字的 n-gram，而 value 則是寫入完整的關鍵字|
|讀取|先使用 `ZRANK` 定位，再使用 `ZRANGE` 取得所需要的筆數，最後再用 regex 過濾不必要的 value，可以使用 lua 開發|直接使用 `ZRANGE` 取得所需要的 value，不用另外使用 regex 過濾|
|刪除|可以直接使用 `DEL` 刪除所有資料|必須使用 `SCAN` 將資料一批一批的刪除|
|資料大小 (key prefix 用 `autocomplete_index`，及`東京鐵塔`、`東京巨蛋球場`為例)|68 bytes|242 bytes|

### 總結

1. 為了節省空間：可以使用簡單版的方式開發，但在後端需要花比較多的程式碼做過濾
2. 使用頻率做排序：一定要用複雜版的方式開發，因為如果用簡單版開發的話，zset 會無法直接排序
3. 簡單版無法保證取得結果的筆數，因為 `ZRANGE` 會包括其他不必要的內容，所以最後過濾完可能會沒有資料
4. 如果需要維護資料，必須要有至少一倍額外的儲存空間，在維護時先用不同的 key prefix 寫入，最後再用 `RENAME` 改 key prefix
    * 如果使用複雜版的話，在 `RENAME` 的過程中會花比較多時間
