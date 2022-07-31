## 切 token

zset 在寫入資料時，先把要寫入的文字每一個字切開。以「東京鐵塔」及「東京巨蛋球場」為例，可以切成以下的 token。

<table class="table">
    <thead>
        <tr>
            <th>文字</th>
            <th>結果</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>東京鐵塔</td>
            <td>
                <ul><li>東</li><li>東京</li><li>東京鐵</li><li>東京鐵塔</li></ul>
            </td>
        </tr>
        <tr>
            <td>東京巨蛋球場</td>
            <td>
                <ul><li>東</li><li>東京</li><li>東京巨</li><li>東京巨蛋</li><li>東京巨蛋球</li><li>東京巨蛋球場</li></ul>
            </td>
        </tr>
    </tbody>
</table>
