$(function () {

    var tags = [{
        start: 53,
        end: 85
        }]
    var ranges = [];

    $("html").on("mouseup", function () {

        //  $('pre')[0].prepend("<p>Test</p>")
        // $('pre')[0].append("<p>Test</p>")
        highlightSelection()
    });
    
    $('form').on("submit",function(e){
          e.preventDefault();
        
        
        postContent();
    });
    
    function getRange() {
        var rangePromise = jQuery.Deferred();
        var range = window.getSelection().getRangeAt(0);
        rangePromise.resolve(range)
        return rangePromise.promise();
    }

    function highlightSelection() {
        //window.getSelection().getRangeAt(0).startContainer.prepend("<text>fdsfa</text>")
        //console.log(window.getSelection().getRangeAt(0).endContainer)
        //highlightRange(window.getSelection().getRangeAt(0))
        //            ranges.push(window.getSelection().getRangeAt(0));
        $.when(getRange()).then(
            function (range) {
                console.log(range)
                maketag({
                    start: range.startOffset,
                    end: range.endOffset
                })
            });
        //            var safeRanges = getSafeRanges(userSelection);
        //            for (var i = 0; i < safeRanges.length; i++) {
        //                highlightRange(safeRanges[i]);
        //            }
    }

    function maketag(tagInfo) {

        var text = $("#text")[0].innerHTML

        var newText = text.substring(0, tagInfo.start) + "<span>" + text.substring(tagInfo.start, tagInfo.end) + "</span>" + text.substring(tagInfo.end, text.length)

        var newPre = $('<pre/>')
        newPre.css({
            "z-index": -2,
            opacity: 0.1
        })
        newPre.append(newText)
        $("#highLights").append(newPre)


        infoDialog();



    }

    function infoDialog() {
        $("#dialog").css({
            "visibility": "visible"
        });
        $("#dialog").dialog();
        
   

    }
    
    function postContent() {
         var data = $("form").serializeFormJSON();
       console.log(data)
        $.post( "save.php", { data: JSON.stringify(data) } );
    }

    
    
    
    function highlightRange(range) {
        newNode = document.createElement("param");
        range.endContainer.appendChild(newNode);
        //range.selectNode(document.getElementsByTagName("div").item(0));
        range.insertNode(newNode);
    }
    
    (function ($) {
    $.fn.serializeFormJSON = function () {

        var o = {};
        var a = this.serializeArray();
        $.each(a, function () {
            if (o[this.name]) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };
})(jQuery);

    
});
