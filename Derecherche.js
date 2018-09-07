// ==UserScript==
// @name Derecherche base one searchEngineJump
// @author jvcon
// @contributor iqxin && NLF && ywzhaiqi && ted423
// @description 方便在各个引擎之间跳转，可自定义搜索列表，可视化设置菜单，使用Fontawesome图标。计划丰富搜索列表，对设计师、极客更友好。
// @version 1.1708.29.0
// @created 2017-08-29
// @lastUpdated 2017-08-29

// @namespace
// @homepage https://github.com/Jvcon/Derecherche

// @icon           data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAFSElEQVR4nMWXX4hdVxXGf2vfe89kJg61ia0DYzMTMWnoQ0FJtKmtJsFixT8DBSmYtGMLgq0PCqMEKwmxYzSGyUPBB7XRNi0FC6JtwYovgcS0klJD8SHakoExYhLQFkwn9/aeOfv7fDi3SStJ5o4muN4O7L32b33rz94H/s8WS10cvR3yVQaY++wnkESkwDK2sMy1EwXDtzRRziBhu+dGDG48smSA5kUP//wmAFIkrNwiGMOsBzYAQwTzEEeBY8BJO1fYtF+4laGPv/i/Afz1C1sAYwngZiKmsDcDI0DrHUtL4DRwMGAmUnVcCtpHPsrQbS/1DZDe+VFHblKziIjYBjwD3Iu5ARBwBjgJnAkwMAa+z+ZZqXEX8VZg0T784aUDzH3uk0DtVQvlVsMjwGpMB3gauAu8ieB2YDPwxR5gF/gQ+MeoNUFzACI4d+imvgDOp0BVRWo2AW62eRi8wvY/wNtrgGhDL+7a/gIcBLYBu4HrsPdSzr8K/JlcLk2BaCQstSxN2VptuYO93an7WES0UyORGg1Wfu0QKivyQhfb56yhn4B3Ynew1kD1oDTfJF20vi8NYBvjMVubbWHrOdtPhwaAYPVvfs8Hf1u32bJbDtXVbgFvAj4AOgTGzhPhGMdV/wCvbtmAJSyttzRiuWv7CdttAlY/f/iimwdvfQGiAfmtczg/jnOJ8/txtRbnvgAu6FSPtg1AC3wGPAvgWGRYqiSowLwC1Ru4GoFyFPc3ZM8DfGPLB1jZXlhe74sS6AAc+O6vL+tg6LaX2LP/SSA6tkpcYeee36/0D/C7Ve9BwZs97iLMEMDAE5N07z1wSQebvl/y3KkAGDIUsrHpRp8ACeDGw38kZdPMPtrILhvZ1yZ5TZJxvnwuW40GzSSaDa1vJq1oJXVbKZ9qpv5qoO6Cqr5ULB+zfNrygOX7LS+PlCgeu+eimz/1w0yWaTTScIqYTEERcDoiXovFauddAAA22CeRDyKD/Bnkbd32PNgUj09S/GwrUMt+x14hiWVFI1LEVyPidggi4hfOnuv3nr8AEGC5sj1j+4TtAcu7i4HlDwLLqRawMmtmnidn6JYLGIa7C/mbwHeAgYATQexPjVCVxcZd7SUACDCEfRyznXoMr8Sawf4lcDdwI7AKWAdss/0r2dOyr6kFpCn7hiyPRlDY5mM7z10W4F1KFT+/p6ZwDkgT2HuN19Tz3yXWG+NnJ8uR9h0FSStSRAFBwAmbpu3xbP/T9rzkp2zvtt2RzcvfG15EAaC8/8m6FkgmpWdsTyD/COtv9esnj1haZXvEtiXP2d5jc6es+3qHv8/2uO1v2d4hedA2H/n2vxZX4LwS+78E1PcDqprAOPZao9Gxs5PNkc6dXUKnIuI1Z8+lRijLo8AR2+OWqeeBS8n7bE8bd2x4Zc97FwcAaP307vqyiXi7QzBi7OyXGel8GkJEBAFUWUREIXlnL/LCvgBheZ9h2lLHyvxp5rrFAZZiG3e16zliBm3vsD0lu6i5ja0awppWrjrKmeOPjAL/UQP/rf1h11BPJHckT/dkL+vDjeXC0pRy3qGcB22x9oHZKwcAcPTh5UimzrWnexGXlrCFlAvlakq5eiiX3eLtSXnFAABe3j1c/0PgTp1z77NUKmesjHMulKuttq9X/eq+sgAAx35wTZ0OqWNrWqr2KVelqoqcF3DOL1r5dStfHQCoW03K9ApuWrnam/PCnHN+StZDRHSK1jLgCnXBpeymr/8dS+SFbmH7eiu/TkQnNRrkqmL20XVXFwBg7QOzRASSsDJFaxndssPso+uu9tH92b8BowSyPc/iZtEAAAAASUVORK5CYII=

// @include        *google*
// @include        *baidu.com*
// @include        *bing.com*
// @include        *yahoo.com*
// @include        *sogou.com*
// @include        *duckduckgo.com*
// @include        *so.com* 
// @include        *youdao.com* 
// @include        *cnki.net* 
// @include        *zdic.net* 
// @include        *wikipedia.com* 
// @include        *wikiwand.com*
// @include        *moegirl.com*
// @include        *zhihu.com*
// @include        *guokr.com*
// @include        *baike.com*
// @include        *docin.com*


// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @grant       GM_deleteValue
// @run-at      document-end

// ==/UserScript==

(function () {
    'use strict';

    function start() {
        // 根据规则把搜索引擎列表插入到指定网站.
        var rules = [
            {
                // 你要加载的网站的名字.
                name : "Google Web",
                // 是否启用
                enabled : ture,
                // 在哪个网站上加载,正则.
                url : /^https?:\/\/www\.google(?:\.[A-z]{2,3}){1,2}\/[^?]+\?(?!tbm=)(?:&?q=|(?:[^#](?!&tbm=))+?&q=)(?:.(?!&tbm=))*$/,
                // 加载哪个类型的列表:
                engineList : 'web',
                // 若固定到顶栏,是否给一个高.
                //fixedTop : 100,
                // 给引擎列表的样式.
                sytle: '\
                    margin-left : 142px;\
                    z-index : 100;\
                    margin-top : 5px;\
                    ',
                // 插入文档,相关
                // target 将引擎跳转工具栏插入到文档的某个元素
                    // (请使用xpath匹配,比如: '//*[@id="subform_ctrl"]'  或者 css匹配(请加上 'css;' 的前缀),比如: 'css;#subform_ctrl' );
                // keyword 使用 xpath 或者 css选中一个form input元素 或者 该项是一个函数,使用返回值
                // where 四种:
                    // 'beforeBegin'(插入到给定元素的前面) ;
                    // 'afterBegin'(作为给定元素的第一个子元素) ;
                    // 'beforeEnd' (作为给定元素的最后一个子元素) ;
                    // 'afterEnd'(插入到给定元素的后面);.
                insertIntoDoc : {
                    target: 'css;#appbar',
                    // keyword: function () {
                        // var input = document.getElementById('lst-ib');
                        // if (input) return input.value;
                    // },
                    keyword : '//input[@name="q"]',
                    where : 'beforBegin',
                },
                // 修改源网页来适应跳转栏
                sytlish : 'body.vasq #hdtbMenus.hdtb-td-o{top:100px !important}'
            },
            {name: "google-hash-query",// 不刷新页面显示搜索结果的google
                enabled: true,
                url: /^https?:\/\/www\.google(?:\.[A-z]{2,3}){1,2}\/[^#]*#(?:&?q=|.+?&q=).+/,
                engineList: 'web',
                style: '\
                    margin-left: 138px;\
                    z-index: 100;\
                    margin-top:5px;\
                ',
                insertIntoDoc: {
                    target: 'css;#appbar',
                    keyword: function () {
                        var input = document.getElementById('lst-ib');
                        if (input) return input.value;
                    },
                    where: 'beforeBegin',
                },
                stylish: 'body.vasq #hdtbMenus.hdtb-td-o{top:100px !important}'
            },
            {name: "Baidu",
                url: /^https?:\/\/www\.baidu\.com\/(?:s|baidu)/,
                enabled: true,
                engineList: "web",
                fixedTop:56,
                style: '\
                    margin-top:8px;\
                    margin-bottom: -5px;\
                    z-index: 99;\
                    margin-left: 113px;\
                ',
                insertIntoDoc: {
                    keyword: 'css;input#kw',
                    target: 'css;#s_tab',
                    where: 'afterEnd',
                },
                stylish:".headBlock,.se_common_hint{display:none !important}"
            },
            {name: "Bing",
                url: /^https?:\/\/[^.]*\.bing\.com\/search/,
                enabled: true,
                engineList: "web",
                style: '\
                    padding-left:15px;\
                    margin-top:10px;\
                    margin-left: 100px;\
                    margin-bottom:-20px;\
                ',
                insertIntoDoc: {
                    keyword: 'css;#sb_form_q',
                    target: 'css;#b_content',
                    where: 'beforeBegin',
                },
            },
        ];

        // 搜索引擎列表
        var engineList = {};

        // 图标列表
        var icon = {};
        icon = {
            google:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAD1klEQVR4nMWXbWhbVRjHf+cmTZq3hU67tcvmaql2L2q3FdTqkEodTESZ+GEKExX3YTrRyhCmMnDgCkP8EHwBnV+UMRyIiGLZLG7TMq22MsegOErrSmnarFub0CbN6z1+KLnNzb1JbmLF59M5T57z/H835zlvQkopqcCklBQbIoRACFFJOoQVgJyooiiWkqqqahmmJEClwtWAFAVQVbVq4UpymQIUG5CdmiR5/gfSl4bIjI+hRiMgJcoqP7aNzTjaduDs2o0tsMEyhAHALDA7HSL26Qck+89BuZIRAueDnXgOvIatYV1ZCB2AWUCir5eF4HFkYrG0cCGHy43v0Ns4O3eVhNBaZsUW//Jz5o+/U7E4gFyMkxr81eBXFEW3jO35APnVmujrJfbZR6bJ7c0tOO59AFtjAIQgG5okNfgLmdERLab2sSfxdR82h8vTEnLJdOLZqUnm9j+DTCZ0A22NAbzdh3G032eaODU0wPz7x3Du7MR78JBpTCGEkFLKwnmJBV8l/t2AbkDN5rvw9wQRPl/pxPEYwu0pGQPLtWBYBXJxjGz/FuLnGkkO1QOgrL6FuhOnUPx1ZRNXakrhNiDDp8Gm4t41iWfPNYRD4nnx4H8iLqXEXjj/cvaC1nZsjmAPeHF07V5xcQ3A4IwN6/q2O+4HuyFMs66emGXBI3ucdG7R5zLujekZXVe4WiwLlLNQxLiLrsxpY9FSGSsANfW6royPGEKqNY/TeCwbJld4tyJnw1p/OjLMGjVDjWJeBz++Zb7m/55R2X9Cv4Wv9RsBlMLLgqh7WGufSa7n6VAzvdd+MhUpZb+PZg2+Oxttei0hTADW7iWNnfcW7uHo/A4S2Pj4yiluJiKWxRcSkq9+S+t8t92q0FDwDwghlmpAVdVlp6uJTzxv8nWiSfPNJqJ0/9xDNDVfVjydhXe/STIb0xfco236KcxpKjmSfNt79wHc9lqd76+5MfadfYP+0B9FxUci47z0/WkGx1I6/2qP4PHtegDdaZgjyj+Qzoz3c2QgaCrUtCpAR8N2NngbEEJwffEml64Pc/nGVSQSW6IFd/gVRGZp+z76VC07W5fnP19LAyjckgFOXv2W4J9fFP3iUiayPlzhl3mhvY3nH3LofsvX0j5ZCKGrBYB9rU9wrON13HZXxQCKPc6zj0wZxHNXdU3XyqV0On6DDy+fpG/iIqqFh1T7mq10b3uOTXXNBvGSl9JSgQBTsRn6Ji4yGL7CaHSCuWQUKcHv9LHRt45t9ZvoWt9Ba93thrGWr+XlBlRjFT9Mcva/Ps3+DciKPU5LwZgmq+J5/g/N4OUGvdHwnQAAAABJRU5ErkJggg==",
            baidu:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABpElEQVR4nKWTvUtbURjGfzcf5prqEBFMBpWCHUIVISKRoIgQ3QQRRNBM1UHqX+AiLg4uQpeCiKigIkIkf4DgYAmVQBDEL2iHVIsfaGpi1Nxrck+HaGLMzSB5xuec9znP+5z3lYQQghJgKKW4qMDW9gPNbaf4AwkA5hbiTE1HSWuFd016AhubCZ6eBEurdzgcJr59vwXA45bp8VqLO4j+yzxhtWboKpuB8/NU9vyF13UQ3lPwjVzibpWZnLAhWySGByupqzWxG1JoaizjU4OZ4G4Sj1vOKYhnzMxGhdMVEU5XRPz6rQo9dHSfCacrIlbW41ku68lhz5iRLRLV1UYOjlT6hy4Y8F1w9jdFUhFc36QBODxSC1sYGqzEZjPwsd5MLKbxZeyKu0Qmk9HxK9YW7XjcMqGwgrcrF6T0dpCub9L4Ri75c5p6TdP0uYzl+Rpki1T8F2JxTbcYYP9AZfRrzpWugD+Q0C1+QXhPwR+4Ly5gNufb04Om5a9O3iT29X5gJ/jIj2CSuloTne3lGI3wM6RwfKLS2mJhoL8iT6AgxPei5G38Dx7mvwaRBxETAAAAAElFTkSuQmCC",
            bing:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAB5ElEQVQ4jZ2Tv0sbYRyHX5Uzl8bLVNrSToUOHbr0T2gHqf1Baf8AvcUruNcpd5e75BK9H0Q9gptCogZKh6J2kWtDhkpxkmCwOIidijpYECoI5unQNo0QauwHnuUD78PL9/2+on9w0ItrWiSraiSNjER9w8NRTFUjuQvimhaJuKZ9ThaLJHyfGzMz3AxDRC6H7LooQYDi+50JApJhiJBVNVJ8nx7TZKhU4svhIYX1dW4XCsRsm4FstjOOg+K6fwXCMHiysMCfvKhUELp+OcHjcrkleL60hEil/l/wslKhxzAQuk6vaRLPZC5/g9dra5jVKvdnZ5FtG5FKIVkWSjeCB3NzvFpeBuD7yQnvd3YYW13lztQUsm1fLHhUKnE1n6e+v0973mxtIaXTJDKZLoY4Ps71yUneNhqt/uPuLrJlceUiwcP5ea5NTJCt1fh2fNzq321vI6XT/xacNZuUNzdpHBy0Dp41m1Tqde4Vi/RbVucZPG1bpPbU9vZ4triIlE7TZ5qdXyFmWdzyfYobG/w4PQXg69ERYysrKI6D0PXzu9Am+KAEAYrjELNthGEwVC5jVqvcDUOErv/6E45znlwOxfMQ8ujop2QYorguiueRcF16HQeRzSLl8wz87hXXPY/nkZye5icfi28JEi0cegAAAABJRU5ErkJggg==',
            edit:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAQAAADZc7J/AAACDklEQVR4nJXVzUtUURjH8Y/mSNKkki2iwiApxHQ1q/6C+gusoCB6oxbRRqFNL4sWtRKqhVSLIDe1CqpNiwjKIilKLKKFEr2Z2qI0xxHN0+LOm+PMOPOc1T2H7/f5ncO991BdNer30zmxKrl0xV2zKJjRoy6aqkkvbbdVLPuUq+8+5uGXnVILki7qsxgtNDtrTNLcijHvrdYsft0/wQ8DZgSzeqMUDW4IJceYHcvwCd1ies0KZvWI1TnhIH6574Olgg0E74zmhZ902j304by4Cxp5LPjtQNmjy3XPVK2rgmCBCcGgdVXhdBgUBCMEwVMNVeIvBMFLifKC8vgrndFBlRJUhJcWFMd3ZfGuzFRxwWrdu3KTxQQVhi8lqApfKVhf0d4bc2/OckG9Pkur7r3TEw+1FRO0GxdM2Vc2/HHBgr1If935UTfigbt5+C27MeSo9+m5GJYitlCwWR2G8oQZ/FgWX1aFgnZMG852v5nFR4rhMn+2dDVJYFpKqy0SDksUhF9FsE0bWgyIa9bIanihoEUcDTrSz4ueOVMOLxQkzVkrZcaoNz755rmpcnihYNghm3w26Ys/5cGcIKgRBJDyqCIquj8C1PqKZvHK+qVrJ5bMRwmGterU64pkkZupWO3RjXkzUZj9+jVZMGK6IsEaHTbgjpOSUYZL/pa5m4qPIbtyznpHvJaqGB53O33h4T/3VzLuzDhE6AAAAABJRU5ErkJggg==",
            del:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAADAFBMVEUAAADsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVHsbVH///9VVVVWVlZXV1dYWFhZWVlaWlpbW1tcXFxdXV1eXl5fX19gYGBhYWFiYmJjY2NkZGRlZWVmZmZnZ2doaGhpaWlqampra2tsbGxtbW1ubm5vb29wcHBxcXFycnJzc3N0dHR1dXV2dnZ3d3d4eHh5eXl6enp7e3t8fHx9fX1+fn5/f3+AgICBgYGCgoKDg4OEhISFhYWGhoaHh4eIiIiJiYmKioqLi4uMjIyNjY2Ojo6Pj4+QkJCRkZGSkpKTk5OUlJSVlZWWlpaXl5eYmJiZmZmampqbm5ucnJydnZ2enp6fn5+goKChoaGioqKjo6OkpKSlpaWmpqanp6eoqKipqamqqqqrq6usrKytra2urq6vr6+wsLCxsbGysrKzs7O0tLS1tbW2tra3t7e4uLi5ubm6urq7u7u8vLy9vb2+vr6/v7/AwMDBwcHCwsLDw8PExMTFxcXGxsbHx8fIyMjJycnKysrLy8vMzMzNzc3Ozs7Pz8/Q0NDR0dHS0tLT09PU1NTV1dXW1tbX19fY2NjZ2dna2trb29vc3Nzd3d3e3t7f39/g4ODh4eHi4uLj4+Pk5OTl5eXm5ubn5+fo6Ojp6enq6urr6+vs7Ozt7e3u7u7v7+/w8PDx8fHy8vLz8/P09PT19fX29vb39/f4+Pj5+fn6+vr7+/v8/Pz9/f3+/v7///8dej9TAAAAU3RSTlMAAABm7P/sZgAAABPO////zhQAAB/i/////////+IfAAAe4fvk4AAAAAAd/+Q3GxwAFR85FQBjz+LPY+v////r6//////rZM/h4c9jABUdHRUAAP0EcPoAAAEuSURBVHic7ZRnc8IwDIbdEUZHGB0kDsMOMcOMttBBB93Qvcj//y9VjB0Czh13/dz3ixT5OVmSYyMktLK6tm74oYxEMpVGUW1sbm2bM8DMZHP5OWBnd2+/YNnYAWHbKhRL5cocQKjrWFWPuSDmVS3HpUQu1eoNQkiTM9xqd7oHoG6n3cKMNyHcqNfQ4VGPUsr7nh0FbK/PIdw7PkGnZwOZNrqF9AfnF+jyaigLixYp/eH1Dbq9u4eAHyOAHh5HaPz0DCnjANjm5fUNvX98QoGCxyo5Fjmh0K/vH2hzAi0KnqnymMgJrU6gzemQBM+DZpX1/XBYUyAYTTAuZTUg+Aw8Zf+BvwJLR730sPTjXgD0H2YB0BUClXKpGAeE1y+fy2ZMfX12gdOpZMLQAfkE/AL7e5vGZF+dOQAAAABJRU5ErkJggg==",
        };
        // 按类别分类搜索列表
        // 网页搜索列表
        engineList.web = [];

        engineList.web[0] = {
            // 搜索引擎名称
            name : 'Google',
            // 搜索引擎地址,关键字变量用%s代替
            url: 'https://www.google.com/search?q=%s&ie=utf-8&oe=utf-8',
            // 搜索引擎的站点图标
            // favicon : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACyElEQVQ4jXWT72tTdxTGv4yN+cY/oMFGqQpD7ZjtsAF/oPEXGFhtbUEn4mSTatSJVua0UNNSEG/01UAH0m6dN1hdW5SbrE3sgkr1hb9lRTFW3Upqcy1NzE1yc/Prfvaia7dM+7w853keznM4R4h38aHdbt8gSZJbURSv3++/Jsuyp6GhwWm1Wsvew/8XNptteTAYvMEMiKjquMvlahVCzHpHXFdXV69pWhLAHHtNSm7nbdMhYo170U61kLkZnDZSFMUrhJg9La6qqrLpum4A6FcuM+5YReRTK5HyUiLlViJLSolULiB2eA+mFgdAlmWPEOIDIYT4aHBw8DaA3tODavuESMV8orvqSZ7/Af1XD/HW71HXVKKdbsPUU9OT1NTU1Aq73b4BgPhLJrYtY2zxQuKtxzATWlH+/MvnYJpFtUAgMCDcbvcZAHOkjXSHIH50LYW3iZn2WIRoNBoTiqJ4AfIPq8n1CwrDB4pIPw5kcP6k0+hJ0+hJ8+0vaU5eNdCzk30RCAQGAPL311PwCnjVXGSw+7zOvIMa5UcTVDQl+Ox4Aoc7yfg/QwpZlj0A5pNvML2Cp/d2FhmExgrceZHn0Z952q9nqGhKsONsCiMP2Ww2J5xO534A481V3N1lLL24md/Dd96b2dWdZfF3Gi29xqR5KDQsSkpK5kaj0ZhhFtgVbKOkfTUru7+kK+RjNKkSzyR4FgvRHOzn8+YJVrakefxXHgBJkk4LIYRwuVytAOHUG7b2H8basZr5netY2/sVm737WHZpC3M6VrDk3Aku3Jq8g9HR0TGLxWKdOsaPfT7fbwBaLsWZBx1svPI1i+RNlP28jsquLWz3H8E3cg0AwzAyDofji/+/w+zOzs4LU3mTZprHE8+4q/7BcGJkeg/hcPh1dXV1zYwfWVtbW9fX1+dXVXV8SpTL5fJDQ0NPJElyWyyW0v/y/wbuo60BpWkyAAAAAABJRU5ErkJggg==',
            favicon : icon.google,
            // 搜索引擎编码（默认utf-8）如果跳转后乱码可以填写 'gbk'
            encoding : 'utf-8',
            // 新标签页打开
            // blank:true,
            // 禁用
            // disable:true,
        };
        engineList.web[1] = {
            name: '百度',
            url: 'https://www.baidu.com/s?wd=%s&ie=utf-8',
            favicon: icon.baidu,
        };
        engineList.web[2] = {
            name: '必应',
            url: 'https://cn.bing.com/search?q=%s',
            favicon: icon.bing,
        };

        var settingData = {

        }

        // 创建dom
        var aPattern = '<a href="" class="sej-engine" target="$blank$" encoding="$encoding$" url="$url$"><img src="$favicon$" class="sej-engine-icon" />$name$</a>';
        var container = document.createElement('sejspan');
        container.id = 'sej-container';
        container.className = "rwl-exempt";

        container.addEventListener('mousedown', mousedownhandler, true);

        if (matchedRule.style) {
            container.style.cssText = matchedRule.style;
        };

        var dropLists = [];
        engineList.details.forEach(function (item) {
            var category = item[1];
            var cName = item[0];
            var engines = [];

            engineList[category].forEach(function (engine) {
                // 检测是否用搜索搜某一网站 site:xxx.xx
                var engineUrl = engine.url;
                var siteIndex = engineUrl.lastIndexOf("site");
                var siteMark = null;
                if(~siteIndex){
                    var siteURL = engineUrl.slice(siteIndex);
                    siteMark = /([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}/.test(siteURL);
                    // console.log(/([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}/.test(siteURL),siteURL);
                }

                if (!siteMark && matchedRule.url.test(engineUrl)) return;// 去掉跳转到当前引擎的引擎
                if(engine.disable) return;
                var a = aPattern.replace('$encoding$', (engine.encoding || 'utf-8').toLowerCase())
                    .replace('$url$', engineUrl)
                    .replace('$name$', engine.name);

                if (engine.favicon) {
                    a = a.replace('$favicon$', engine.favicon);
                } else {
                    a = a.replace('src="$favicon$"', '');
                };
                if (getSettingData.newtab || engine.blank) {
                    a = a.replace('$blank$', "_blank");
                } else {
                    a = a.replace('target="$blank$"', '');
                };

                engines.push(a);
            });
            // 非空列表
            if (!engines.length) return;

            engines = engines.join('');

            // 展开当前搜索分类列表
            if (!getSettingData.foldlist && category == matchedRule.engineList) {
                container.innerHTML = engines;
            } else {
                var dropList = document.createElement('sejspan');
                dropList.className = 'sej-drop-list rwl-exempt';
                dropList.innerHTML = engines;

                // 非空列表
                var a = dropList.firstElementChild.cloneNode(true);
                a.className = a.className + ' sej-drop-list-trigger';
                a.lastChild.nodeValue = cName;
                dropLists.push([a, dropList]);
            };
        });

        //将各个搜索列表插入文档中
        dropLists.forEach(function (item) {
            container.appendChild(item[0]);
            document.body.appendChild(item[1]);
            item[1].addEventListener('mousedown', mousedownhandler, true);

            new DropDownList(item[0], item[1]);
        });

        // 插入到文档中
        switch (matchedRule.insertIntoDoc.where.toLowerCase()) {
            case 'beforebegin' :
                iTarget.parentNode.insertBefore(container, iTarget);
            break;
            case 'afterbegin' :
                if (iTarget.firstChild) {
                    iTarget.insertBefore(container, iTarget.firstChild);
                } else {
                    iTarget.appendChild(container);
                };
            break;
            case 'beforeend' :
                iTarget.appendChild(container);
            break;
            case 'afterend' :
                if (iTarget.nextSibling) {
                    iTarget.parentNode.insertBefore(container, iTarget.nextSibling);
                } else {
                    iTarget.parentNode.appendChild(container);
                };
            break;
        };

        // todo: 此处与上面重复,在百度页面会插入两次
        if(/^https?:\/\/www\.baidu\.com\/(?:s|baidu)/.test(url)){
            var sej = document.getElementsByTagName("sejspan")[0];
            sej.appendChild(globalStyle);

            dropLists.forEach(function (item) {
                container.appendChild(item[0]);
                // document.body.appendChild(item[1]);
                var sej = document.getElementsByTagName("sejspan")[0];
                sej.appendChild(item[1]);
                item[1].addEventListener('mousedown', mousedownhandler, true);

                new DropDownList(item[0], item[1]);
            });
        };

        // 由于与要插入网页的样式无法很好的兼容,更改源网页的样式
        if(matchedRule.stylish){GM_addStyle(matchedRule.stylish);};
        //固定搜索栏
        if(getSettingData.fixedTop){
            window.onscroll = function(){
                fixedTopFun(matchedRule.fixedTop);
            };
            // 固定搜索栏
            function fixedTopFun(height){
                var obj = document.getElementById("sej-container");
                var objTop = obj.offsetTop ;
                var objLeft = obj.offsetLeft ;

                var current = obj.offsetParent;
                while (current !== null){
                    objLeft += current.offsetLeft;
                    current = current.offsetParent;
                }

                var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
                // console.log("obj.offsetLeft",obj.offsetLeft);

                if(height){
                    objTop = height;
                }else{
                    height = 0;
                }

                if(scrollTop <= objTop){
                    obj.style.cssText = matchedRule.style;
                }else if(obj.style.position!="fixed"){
                    // console.log(scrollTop,objTop,scrollTop - objTop);
                    var objstyle = window.getComputedStyle(obj , null);
                    var marginTop = parseInt(objstyle.marginTop);
                    var marginLeft = parseInt(objstyle.marginLeft);
                    var marginRight = parseInt(objstyle.marginRight);
                    //console.log(objLeft,marginLeft);

                    obj.style.top = height - marginTop + 'px';
                    
                    // 如果之前未设置颜色,则默认设置为白色
                    if(objstyle.backgroundColor === "rgba(0, 0, 0, 0)" || objstyle.backgroundColor === "transparent"){
                        obj.style.background = '#fff'; 
                    }
                    // obj.style.zIndex = '999';

                    obj.style.left = getElementLeft(obj) - marginLeft + "px";
                    // obj.style.left = getElementLeft(obj) + "px";
                    debug("objLeft: ",objLeft,"marginLeft: ",marginLeft,"marginRight: ",marginRight,"getElementLeft: ",getElementLeft(obj));
                    // 知乎等网站的情况 利用 margin 居中
                    if(marginRight === marginLeft && marginRight != 0){
                        obj.style.left = marginLeft + "px";
                    }
                    // 淘宝等网站的情况 利用 text-align 居中
                    if(obj.style.textAlign === "center"){
                        obj.style.width = objstyle.width;
                    }

                    obj.style.position = 'fixed';
                }
            }
        } else {
            window.onscroll = function(){
                return true;
            };
        };

    }
})