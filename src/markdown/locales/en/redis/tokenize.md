## Tokenization

You must to breaks it up into individual characters before write text to zset. E.g. "house" and "horse" can divide into tokens.

<table class="table">
    <thead>
        <tr>
            <th>Text</th>
            <th>Result</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>
                <ul><li>h</li><li>ho</li><li>hou</li><li>hous</li><li>house</li></ul>
            </td>
            <td>
                <ul><li>h</li><li>ho</li><li>hor</li><li>hors</li><li>horse</li></ul>
            </td>
        </tr>
    </tbody>
</table>