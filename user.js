// ==UserScript==
// @name searchEngineJump-Jversion
// @author jvcon
// @contributor iqxin && NLF && ywzhaiqi && ted423
// @description 方便在各个引擎之间跳转，可自定义搜索列表，可视化设置菜单，使用Fontawesome图标。计划丰富搜索列表，对设计师、极客更友好。
// @version 1.1708.29.0
// @created 2017-08-29
// @lastUpdated 2017-08-29
// @include *
// @namespace
// @homepage https://github.com/Jvcon/SEJ-jversion
// @icon           data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAFSElEQVR4nMWXX4hdVxXGf2vfe89kJg61ia0DYzMTMWnoQ0FJtKmtJsFixT8DBSmYtGMLgq0PCqMEKwmxYzSGyUPBB7XRNi0FC6JtwYovgcS0klJD8SHakoExYhLQFkwn9/aeOfv7fDi3SStJ5o4muN4O7L32b33rz94H/s8WS10cvR3yVQaY++wnkESkwDK2sMy1EwXDtzRRziBhu+dGDG48smSA5kUP//wmAFIkrNwiGMOsBzYAQwTzEEeBY8BJO1fYtF+4laGPv/i/Afz1C1sAYwngZiKmsDcDI0DrHUtL4DRwMGAmUnVcCtpHPsrQbS/1DZDe+VFHblKziIjYBjwD3Iu5ARBwBjgJnAkwMAa+z+ZZqXEX8VZg0T784aUDzH3uk0DtVQvlVsMjwGpMB3gauAu8ieB2YDPwxR5gF/gQ+MeoNUFzACI4d+imvgDOp0BVRWo2AW62eRi8wvY/wNtrgGhDL+7a/gIcBLYBu4HrsPdSzr8K/JlcLk2BaCQstSxN2VptuYO93an7WES0UyORGg1Wfu0QKivyQhfb56yhn4B3Ynew1kD1oDTfJF20vi8NYBvjMVubbWHrOdtPhwaAYPVvfs8Hf1u32bJbDtXVbgFvAj4AOgTGzhPhGMdV/wCvbtmAJSyttzRiuWv7CdttAlY/f/iimwdvfQGiAfmtczg/jnOJ8/txtRbnvgAu6FSPtg1AC3wGPAvgWGRYqiSowLwC1Ru4GoFyFPc3ZM8DfGPLB1jZXlhe74sS6AAc+O6vL+tg6LaX2LP/SSA6tkpcYeee36/0D/C7Ve9BwZs97iLMEMDAE5N07z1wSQebvl/y3KkAGDIUsrHpRp8ACeDGw38kZdPMPtrILhvZ1yZ5TZJxvnwuW40GzSSaDa1vJq1oJXVbKZ9qpv5qoO6Cqr5ULB+zfNrygOX7LS+PlCgeu+eimz/1w0yWaTTScIqYTEERcDoiXovFauddAAA22CeRDyKD/Bnkbd32PNgUj09S/GwrUMt+x14hiWVFI1LEVyPidggi4hfOnuv3nr8AEGC5sj1j+4TtAcu7i4HlDwLLqRawMmtmnidn6JYLGIa7C/mbwHeAgYATQexPjVCVxcZd7SUACDCEfRyznXoMr8Sawf4lcDdwI7AKWAdss/0r2dOyr6kFpCn7hiyPRlDY5mM7z10W4F1KFT+/p6ZwDkgT2HuN19Tz3yXWG+NnJ8uR9h0FSStSRAFBwAmbpu3xbP/T9rzkp2zvtt2RzcvfG15EAaC8/8m6FkgmpWdsTyD/COtv9esnj1haZXvEtiXP2d5jc6es+3qHv8/2uO1v2d4hedA2H/n2vxZX4LwS+78E1PcDqprAOPZao9Gxs5PNkc6dXUKnIuI1Z8+lRijLo8AR2+OWqeeBS8n7bE8bd2x4Zc97FwcAaP307vqyiXi7QzBi7OyXGel8GkJEBAFUWUREIXlnL/LCvgBheZ9h2lLHyvxp5rrFAZZiG3e16zliBm3vsD0lu6i5ja0awppWrjrKmeOPjAL/UQP/rf1h11BPJHckT/dkL+vDjeXC0pRy3qGcB22x9oHZKwcAcPTh5UimzrWnexGXlrCFlAvlakq5eiiX3eLtSXnFAABe3j1c/0PgTp1z77NUKmesjHMulKuttq9X/eq+sgAAx35wTZ0OqWNrWqr2KVelqoqcF3DOL1r5dStfHQCoW03K9ApuWrnam/PCnHN+StZDRHSK1jLgCnXBpeymr/8dS+SFbmH7eiu/TkQnNRrkqmL20XVXFwBg7QOzRASSsDJFaxndssPso+uu9tH92b8BowSyPc/iZtEAAAAASUVORK5CYII=

// @include        *google*
// @include        *baidu.com*
// @include        *bing.com*
// @include        *duckduckgo.com*
// @include        *youdao.com*
// @include        *so.com*
// @include        *soku.com*
// @include        *bilibili.tv*
// @include        *bilibili.com*
// @include        *acfun.tv*
// @include        *acfun.cn*
// @include        *youtube.com*
// @include        *so.tv.sohu.com*
// @include        *so.letv.com*
// @include        *so.1ting.com*
// @include        *xiami.com*
// @include        *music.163.com*
// @include        *music.qq.com*
// @include        *so.yinyuetai.com*
// @include        *pixiv.net*
// @include        *flickr.com*
// @include        *huaban.com*
// @include        *www.nicovideo.jp*
// @include        *cn.picsearch.com*
// @include        *deviantart.com*
// @include        *jpg4.info*
// @include        *yyets.com*
// @include        *baiduyun.me*
// @include        *oabt.org*
// @include        *ktxp.com*
// @include        *dmhy.org*
// @include        *shooter.cn*
// @include        *simplecd.me*
// @include        *ed2000.com*
// @include        *taobao.com*
// @include        *list.tmall.com*
// @include        *search.jd.com*
// @include        *search.suning.com*
// @include        *search.dangdang.com*
// @include        *search.yhd.com*
// @include        *amazon.cn*
// @include        *s.mall.360.cn*
// @include        *iciba.com*
// @include        *dict.cn*
// @include        *dict.hjenglish.com*
// @include        *zdic.net*
// @include        *wikipedia.org*
// @include        *zhihu.com*
// @include        *so.hudong.com*
// @include        *docin.com*
// @include        *ishare.iask.sina.com.cn*
// @include        *s.weibo.com*
// @include        *douban.com*
// @include        *search.t.qq.com*
// @include        *twitter.com*
// @include        *facebook.com*
// @include        *runoob.com*
// @include        *pinterest.com*
// @include        *github.com*
// @match          *://*/*

// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @grant       GM_deleteValue
// @run-at      document-end

// ==/UserScript==

（function() {
	'use strict';
	
	
