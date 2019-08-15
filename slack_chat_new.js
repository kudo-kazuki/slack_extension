// ==UserScript==
// @name         slack
// @namespace    kudo
// @version      0.2
// @author       kudo
// @match        https://*.slack.com/*
// @require https://code.jquery.com/jquery-3.4.1.min.js
// @updateURL    https://raw.githubusercontent.com/kudo-kazuki/slack_extension/master/slack_chat_new.js
// ==/UserScript==

(function() {
    /*ボタン追加*/
    $('body').on('mouseenter mousemove', function(e){
        var $root = $(e.target).closest('.c-virtual_list__item');

        if(!$root.length){
            return;
        }

        var $c_message = $root.children('.c-message');
        var $c_message_actions__container = $c_message.children('.c-message_actions__container');

        if(!$c_message_actions__container.length){
            return;
        }

        if(!$c_message_actions__container.children('.c-message_actions__button.quote').length){
            $c_message_actions__container.prepend(`
                <button 
                    class="c-button-unstyled c-message_actions__button quote" 
                    type="button" 
                    aria-label="引用する" 
                    aria-haspopup="true" 
                    data-qa="" 
                    delay="60"
                >
                    <i class="c-icon c-icon--quote" type="small-reaction" aria-hidden="true"></i>
                </button>
            `);
        }

        if(!$c_message_actions__container.children('.c-message_actions__button.reply').length){
            $c_message_actions__container.prepend(`
                <button 
                    class="c-button-unstyled c-message_actions__button reply" 
                    type="button" 
                    aria-label="返信する" 
                    aria-haspopup="true" 
                    data-qa="" 
                    delay="60"
                >
                    <i class="c-icon c-icon--angle-arrow-up-left-alt" type="small-reaction" aria-hidden="true"></i>
                </button>
            `);
        }
    });

    /*ボタンホバー時の吹き出し*/
    $('body').on('mouseenter mousemove', function(e){
        var $target = $(e.target);

        if(!$target.hasClass('c-message_actions__button')){
            return;
        }

        if(!$target.hasClass('reply') && !$target.hasClass('quote')){
            return;
        }

        var top = $target.offset().top - 45;
        var left = $target.offset().left - 20;

        if($target.hasClass('reply')){
            $('body').append(`
                <div class="ReactModalPortal">
                    <div class="ReactModal__Overlay ReactModal__Overlay--after-open c-popover c-popover--no-pointer c-popover--z_menu c-popover--fade" style="animation-duration: 200ms;">
                        <div style="position: absolute; left: ${left}px; top: ${top}px; outline: currentcolor none medium; transition-duration: 200ms;" class="ReactModal__Content ReactModal__Content--after-open popover" tabindex="-1" role="presentation">
                            <div role="presentation">
                                <div id="slack-kit-tooltip" role="tooltip" class="c-tooltip__tip c-tooltip__tip--top" data-qa="tooltip-tip">返信する
                                    <div class="c-tooltip__tip__arrow"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `);
        }

        if($target.hasClass('quote')){
            $('body').append(`
                <div class="ReactModalPortal">
                    <div class="ReactModal__Overlay ReactModal__Overlay--after-open c-popover c-popover--no-pointer c-popover--z_menu c-popover--fade" style="animation-duration: 200ms;">
                        <div style="position: absolute; left: ${left}px; top: ${top}px; outline: currentcolor none medium; transition-duration: 200ms;" class="ReactModal__Content ReactModal__Content--after-open popover" tabindex="-1" role="presentation">
                            <div role="presentation">
                                <div id="slack-kit-tooltip" role="tooltip" class="c-tooltip__tip c-tooltip__tip--top" data-qa="tooltip-tip">引用する
                                    <div class="c-tooltip__tip__arrow"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `);
        }

        $target.on('mouseleave', function(){
            $('body').children('.ReactModalPortal').remove();
        });
    });

    /*返信*/
    $('body').on('click', '.c-message_actions__button.reply', function(e){
        e.preventDefault();

        var $ql_editor = $('.workspace__primary_view_footer').find('.ql-editor');
        var $message = $ql_editor.html();

        if($message == '<p><br></p>'){
            console.log('メッセージ欄が空です。');
            return;
        }

        var $this = $(this);
        var $root = $this.closest('.c-virtual_list__item');
        var $c_message__body = $root.find('.c-message__body');
        var $start_thread_btn = $this.parent().children('button[data-qa="start_thread"]');
        var $c_message__sender = $root.find('.c-message__sender');
        var $c_message__sender_link = $c_message__sender.find('a');
        var reply_user = {
            name: $c_message__sender_link.text(),
            id: $c_message__sender_link.attr('data-message-sender')
        };
        var reply_mention_html = `<ts-mention data-id="${reply_user.id}" data-label="@${reply_user.name}" 
        spellcheck="false" class="c-member_slug c-member_slug--link ts_tip_texty" dir="ltr">Re: @${reply_user.name}</ts-mention>`;

        $message = reply_mention_html + $message;

        $start_thread_btn.trigger('click');/*スレッド開始ボタンクリック*/

        findSecondary_view()
        .then(function($secondary_view_elm) {
            console.log($secondary_view_elm);
            var $post_btn = $secondary_view_elm.post_btn;
            var $ikanimo_toukou_suru_label = $secondary_view_elm.ikanimo_toukou_suru_label;
            $secondary_view_elm.secondary_ql_editor.html($message);

            setTimeout(function(){
                if(!$ikanimo_toukou_suru_label.find('.c-input_checkbox').prop('checked')){
                    $ikanimo_toukou_suru_label.click();
                }

                setTimeout(function(){
                    console.log('投稿');
                    $post_btn.trigger('click');
                    $ql_editor.html('<p><br></p>')
                }, 30);
            }, 600);
        });
    });

    function findSecondary_view(){
        return new Promise(function(resolve, reject){
            var count = 0;
            var findSecondary_viewInterval = setInterval(function(){
                var $p_workspace__secondary_view = $('.p-workspace__secondary_view');
                var $secondary_ql_editor = $p_workspace__secondary_view.find('.ql-editor');
                var $ikanimo_toukou_suru_label = $p_workspace__secondary_view.find('.c-label.p-threads_footer__broadcast_label');
                var $post_btn = $p_workspace__secondary_view.find('.p-threads_footer__send_button.p-message_input__send');

                if($p_workspace__secondary_view.length && $secondary_ql_editor.length && $ikanimo_toukou_suru_label.length && $post_btn.length){
                    clearInterval(findSecondary_viewInterval);
                    console.log('secondary_view要素が全て見つかった。');
                    var $secondary_view_elm = {
                        p_workspace__secondary_view: $p_workspace__secondary_view,
                        secondary_ql_editor: $secondary_ql_editor,
                        ikanimo_toukou_suru_label: $ikanimo_toukou_suru_label,
                        post_btn: $post_btn
                    };
                    count = 0;
                    resolve($secondary_view_elm);
                }

                if(count > 30000 && !$p_workspace__secondary_view.length){
                    alert('たぶん何か調子悪い。');
                    clearInterval(findSecondary_viewInterval);
                    count = 0;
                    reject('たぶん何か調子悪い。');
                }

                count++;
            }, 10);
        });
    }



    var selectedText = '';
    document.addEventListener('selectionchange', () => {
        if(document.getSelection().toString()){
            selectedText = document.getSelection().toString();
        }
    });

    /*引用*/
    $('body').on('click', '.c-message_actions__button.quote', function(e){
        e.preventDefault();

        var $this = $(this);
        var $root = $this.closest('.c-virtual_list__item');
        var $c_message__body = $root.find('.c-message__body');
        var output = '';

        if(selectedText){
            output = selectedText;/*選択範囲*/
        }else{
            output = $c_message__body.html();/*全文*/
        }

        selectedText = '';

        if(output == ''){
            return;
        }

        output = '&gt;' + output;
        output = output.split('<br>').join('<br>&gt;');
        output = output.split('<span class="c-mrkdwn__br" data-stringify-type="paragraph-break"></span>').join('<br><br>&gt;');
        output = output.split('<br>&gt;<a').join('<a');

        var $ql_editor = $('.workspace__primary_view_footer').find('.ql-editor');
        output = $ql_editor.html() + output;
        $ql_editor.html(output);

        setTimeout(function(){
            $ql_editor.children('p').each(function(index){
                var $this = $(this);

                if(index == 0){
                    if($this.html() == '<br>'){
                        $this.remove();
                    }
                    return true;
                }

                if($this.next('p').length && $this.prev('p').length && $this.next('p').html() != '<br>' && $this.prev('p').html() == '<br>' && $this.html() == '<br>'){
                    $this.remove();
                }else if($this.next('p').length && $this.prev('p').length && $this.next('p').html() != '<br>' && $this.prev('p').html() != '<br>' && $this.html() == '<br>'){
                    $this.remove();
                }else if($this.children('a').length){
                    $this.html('&gt;' + $this.html());
                }
            });
            selectedText = '';
        }, 30);
    });


    function findClassicNavBtn(){
        return new Promise(function(resolve, reject){
            var count = 0;
            var findClassicNavBtnInterval = setInterval(function(){
                var $p_classic_nav__model__buttons = $('.p-classic_nav__model__buttons');

                if($p_classic_nav__model__buttons.length){
                    clearInterval(findClassicNavBtnInterval);
                    console.log('.p-classic_nav__model__buttonsが見つかった。');
                    count = 0;
                    resolve($p_classic_nav__model__buttons);
                }

                if(count > 30000 && !$p_classic_nav__model__buttons.length){
                    alert('たぶん何か調子悪い。');
                    clearInterval(findClassicNavBtnInterval);
                    count = 0;
                    reject('たぶん何か調子悪い。');
                }

                count++;
            }, 10);
        });
    }


    findClassicNavBtn()
    .then(function($p_classic_nav__model__buttons) {
        $p_classic_nav__model__buttons.prepend(`
            <a id="all_search_show_btn" href="javascript:void(0);">
                <img src="https://a.slack-edge.com/production-standard-emoji-assets/10.2/google-medium/1f345.png" 
                aria-label="トマト 絵文字" alt=":トマト:" 
                data-stringify-type="emoji" 
                data-stringify-emoji=":tomato:">
            </a>
        `);

        $p_classic_nav__model__buttons.find('#all_search_show_btn').on('click', function(e){
            e.preventDefault();

            var $root = $p_classic_nav__model__buttons.closest('.p-classic_nav');
            var sure_title = '#' + $root.find('.p-classic_nav__model__title__name__button').text();
            console.log(sure_title);
            $('.p-classic_nav__right__search.p-classic_nav__no_drag').click();

            setTimeout(function(){
                var $ql_editor = $('.c-search__input_and_close').find('.ql-editor');
                $ql_editor.focus().html('<p>in:'+ sure_title +' </p>');

                setTimeout(function(){
                    var KEvent = new KeyboardEvent('keydown', { keyCode: 39, altKey: false, shiftKey: false, key: 'ArrowRight'});
                    for(let i = 0; i<100; i++){
                        $ql_editor[0].dispatchEvent(KEvent);
                    }
                }, 100);
            }, 600);
        });
    });


    /*自分にメンションが付いてるやつの背景色を変える*/
    const USER_DATA = JSON.parse(localStorage.getItem('localConfig_v2'));
    const MY_USER_ID = USER_DATA.teams[USER_DATA.lastActiveTeamId].user_id;
    const MY_MENTION_BACKGROUND_COLOR_STYLE = `
        <style>
            .my_mention_background_color_style,
            .my_mention_background_color_style .c-message--light{
                background-color: #DDEBD7 !important;
            }
        </style>
    `;

    $('body').append(MY_MENTION_BACKGROUND_COLOR_STYLE);

    setTimeout(function(){
        var $c_scrollbar__child = $('.p-workspace__primary_view_contents').find('.c-scrollbar__child');
        var mo = new MutationObserver(function(mutations){
            var $c_virtual_list__item = $c_scrollbar__child.find('.c-virtual_list__item');

            $c_virtual_list__item.each(function() {
                var $this = $(this);

                $this.find('a.c-link.c-member_slug').each(function(){
                    var $a = $(this);

                    if($a.attr('data-stringify-id') == MY_USER_ID){
                        $this.addClass('my_mention_background_color_style');

                        return false;
                    }
                });

                $this.find('span.c-mrkdwn__broadcast').each(function(){
                    var $span = $(this);

                    if($span.attr('data-stringify-text') == '@channel' || $span.attr('data-stringify-text') == '@here'){
                        $this.addClass('my_mention_background_color_style');

                        return false;
                    }
                });
            });
        });
        mo.observe($c_scrollbar__child[0], {childList: true, subtree: true});
    }, 5000);



   /*
<span 
    class="c-mrkdwn__broadcast c-mrkdwn__broadcast--link c-mrkdwn__broadcast--mention" 
    data-broadcast-id="BKchannel" 
    data-stringify-text="@channel"
>
        @channel
</span>


    <div class="ReactModalPortal">
        <div class="ReactModal__Overlay ReactModal__Overlay--after-open c-popover c-popover--no-pointer c-popover--z_menu c-popover--fade" style="animation-duration: 200ms;">
            <div style="position: absolute; left: 1186.83px; top: 867.65px; outline: currentcolor none medium; transition-duration: 200ms;" class="ReactModal__Content ReactModal__Content--after-open popover" tabindex="-1" role="presentation">
                <div role="presentation">
                    <div id="slack-kit-tooltip" role="tooltip" class="c-tooltip__tip c-tooltip__tip--top" data-qa="tooltip-tip">リアクションする
                        <div class="c-tooltip__tip__arrow"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <div class="c-message_actions__container c-message__actions" role="group" aria-label="その他のアクション">
        <button 
            class="c-button-unstyled c-message_actions__button" 
            type="button" aria-label="リアクションする" 
            aria-haspopup="true" 
            data-qa="add_reaction_action" 
            delay="60"
        >
            <i class="c-icon c-icon--small-reaction" type="small-reaction" aria-hidden="true"></i>
        </button>

        <button 
            class="c-button-unstyled c-message_actions__button" 
            type="button" 
            aria-label="スレッドを開始する" 
            data-qa="start_thread" 
            delay="60"
        >
            <i class="c-icon c-icon--small-reply" type="small-reply" aria-hidden="true"></i>
        </button>

        <button 
            class="c-button-unstyled c-message_actions__button" 
            type="button" 
            aria-label="メッセージを共有…" 
            aria-haspopup="true" 
            data-qa="share_message" 
            delay="60"
        >
            <i class="c-icon c-icon--share-action" type="share-action" aria-hidden="true"></i>
        </button>

        <button 
            class="c-button-unstyled c-message_actions__button" 
            type="button" 
            aria-label="メッセージにスターを付ける" 
            aria-haspopup="true" 
            data-qa="star_message" 
            delay="60"
        >
            <i class="c-icon c-icon--small-star" type="small-star" aria-hidden="true"></i>
        </button>

        <button 
            class="c-button-unstyled c-message_actions__button" 
            type="button" 
            aria-label="その他" 
            aria-haspopup="true" 
            data-qa="more_message_actions" 
            delay="60"
        >
            <i class="c-icon c-icon--small-ellipsis" type="small-ellipsis" aria-hidden="true"></i>
        </button>
    </div>
    */



    /*
    $('body').append(`
        <style>
            .c-message_actions__container{display:block !important;}

            .slack_icon_show_test{
                list-style-type: none;
                display: flex;
                flex-wrap: wrap;
            }
            .slack_icon_show_test li{
                font-size: 18px;
                list-style-type: none;
                text-align: center;
                width: 10%;
            }
        </style>
    `);
    */

})();



