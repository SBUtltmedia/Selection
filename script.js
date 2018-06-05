  var enableInterval = true;
  var currentUser;
  var comments;




  $(function() {

    var comments = [];
    var count = 0;
    var serial;
    var previousRanges = [];
    rangy.init();
    //applier = rangy.createClassApplier("highlightText");
    applierCount = rangy.createClassApplier("hl" + count);
    var userData;
    var enableInterval;
    loadData().then(restoreHighlights);

    function loadData() {
      var deferred = new $.Deferred();
      $.get('load.php', function(result) {
        commentData = JSON.parse(result);

        currentUser = commentData.netid;
        console.log(commentData);
        commentData.allUsers.forEach(function(element) {
          //console.log(element);
          if (element.name === currentUser) {
            element.comments.forEach(function(comment, index) {
              console.log(comment);
              comments[index] = comment;
            })
          }
        });
        deferred.resolve();
      })
      return deferred.promise();
    }




    $('#dialog').on("click", function(e) {
      e.stopPropagation();
    })



    $("#text").on("mouseup", function() {

      //  $('pre')[0].prepend("<p>Test</p>")
      // $('pre')[0].append("<p>Test</p>")
      //highlightSelection()
      //highlighter.highlightSelection("highlightText", exclusive=false);
      //restoreHighlights();
      highlightCurrentSelection();


      //postContent();
      $('#text').css("pointer-events", "none");
    });

    $('html').on("mousedown", function() {
      $('#text').css("pointer-events", "all");
    });

    $('form').on("submit", function(e) {
      e.preventDefault();
      postContent();
      $("#dialog").dialog("close");
    });

    function getFirstRange() {
      var sel = rangy.getSelection();
      return sel.rangeCount ? sel.getRangeAt(0) : null;
    }

    function getHighlightedRanges() {
      var ranges = [];
      for (i = 0; i < count; i++) {
        var elements = document.getElementsByClassName("hl" + i);
        Array.prototype.forEach.call(elements, function(el) {
          var range = rangy.createRange(el);
          console.log(el);
          if (ranges[i]) {
            ranges[i].union(range);
          } else {
            ranges[i] = range;
          }
        });
      }
      return ranges;
    }

    function highlightCurrentSelection() {
      //previousRanges = previousRanges.length ? unhighlightPreviousRange(previousRanges) : [];
      serial = rangy.serializeRange(getFirstRange());

      //applier.applyToSelection();
      applierCount.applyToSelection();
      previousRanges.push(getFirstRange());
      applierCount = rangy.createClassApplier("hl" + count);

      highlightPrompt();
    }

    function highlightRange(range) {
      //applier.applyToRange(range);
      applierCount.applyToRange(range);
      highlightPrompt();
      applierCount = rangy.createClassApplier("hl" + count);
    }

    function unhighlightRange(range) {
      //applier.undoToRange(range);
      count--;
      applierCount = rangy.createClassApplier("hl" + count);
      applierCount.undoToRange(range);
      highlightPrompt();
    }

    function unhighlightPreviousRange(ranges) {
      unhighlightRange(ranges.pop());
      return ranges;
    }

    function highlightPrompt() {
      var comment = {
        "commentID": "temp_" + Date.now(),
        "count": count,
        "serial": serial
      };
      $("#dialog").css({
        "visibility": "visible"
      });
      $("#dialog").dialog();
      $("#dialog").dialog({
        modal: true
      });
      count++;
    }

    function restoreHighlights() {
      comments.forEach(function(comment) {
        var range = rangy.deserializeRange(comment.serial);
        highlightRange(rangy.deserializeRange(comment.serial));
      });
      console.log(getHighlightedRanges());

    }

    //      $('span').on("mouseover", function () {
    //          if (this.hasClass("highlightText")) {
    //              if ($("#dialog").css('visibility') == "hidden") {
    //                  $("#dialog").css({
    //                      "visibility": "visible"
    //                  });
    //                  $("#dialog").dialog();
    //                  $("#commentForm input[name=start]").val(tagInfo.start);
    //                  $("#commentForm input[name=end]").val(tagInfo.end);
    //              }
    //          }
    //      });

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
        function(range) {
          console.log(range)
          maketagAndDialog({
            start: range.startOffset,
            end: range.endOffset
          })
        });
      //            var safeRanges = getSafeRanges(userSelection);
      //            for (var i = 0; i < safeRanges.length; i++) {
      //                highlightRange(safeRanges[i]);
      //            }
    }


    function maketagAndDialog(tagInfo) {
      if (tagInfo.start != tagInfo.end) {
        maketag(tagInfo);
        infoDialog(tagInfo);
      }
    }

    function maketag(tagInfo) {

      var text = $("#text")[0].innerHTML
      var textBefore = $('<span/>', {
        "class": "beforeText"
      });
      textBefore.html(text.substring(0, tagInfo.start))
      var highlight = $('<span/>', {
        "class": "highlightText",
        "id": 'span_' + tagInfo.index
      });

      highlight.html(text.substring(tagInfo.start, tagInfo.end))
      //var newText = text.substring(0, tagInfo.start) + "<span id='span_" + tagInfo.index + "'>" + text.substring(tagInfo.start, tagInfo.end) + "</span>"

      var newPre = $('<pre/>', {
        id: "comment_" + tagInfo.index
      })
      // newPre.css({
      //     "z-index": tagInfo.index
      // })

      //        var singlePre = $('<pre/>')
      //        singlePre.css({
      //            "z-index": 2
      //        })

      newPre.append(textBefore)
      newPre.append(highlight)

      highlight.on("mouseover", function(e) {
        console.log("Highlight works", this);


        $("#dialog").css({
          "visibility": "visible"
        });
        $("#dialog").dialog();
        infoDialog(tagInfo);

        //console.log("tagInfo.start: ", tagInfo.start);
        //console.log("tagInfo.end: ", tagInfo.end);

        // $("#commentForm input[name=name]").val(tagInfo.start);
        // $("#commentForm input[name=field1]").val(tagInfo.end);
      });



      $("#highlights").append(newPre)
    }


    function returnComment(commentID) {




      var com = comments.find(function(item) {

        return item.commentID == commentID;
      });

      return com;
    }


    function infoDialog(tagInfo) {

      var comment = returnComment(tagInfo.commentID) || {
        "commentID": "temp_" + Date.now(),
        "start": tagInfo.start,
        "end": tagInfo.end
      };

      console.log(comment)
      for (i in comment) {

        $("[name=" + i + "]").val(comment[i])


      }

      $("#dialog").css({
        "visibility": "visible"
      });
      $("#dialog").dialog();
      //          $("#commentForm input[name=start]").val(tagInfo.start);
      //
      //          $("#commentForm input[name=end]").val(tagInfo.end);
    }

    function postContent() {
      var data = $("#commentForm").serializeFormJSON();
      data.serial = serial;
      console.log(data);
      $.post("save.php", {
        data: JSON.stringify(data)
      });
      previousRanges = [];

    }
    /*if (enableInterval) {
          setInterval(function () {

              var preLength = $('pre').length
              $("pre").each(function (index) {

                  var zIndex = (parseInt($(this).css('zIndex')) + 1) % preLength;
                  $(this).css('zIndex', zIndex)
              })
          }, 100);
      }
*/

    /*function highlightRange(range) {
        newNode = document.createElement("param");
        range.endContainer.appendChild(newNode);
        //range.selectNode(document.getElementsByTagName("div").item(0));
        range.insertNode(newNode);
    }*/

    (function($) {
      $.fn.serializeFormJSON = function() {

        var o = {};
        var a = this.serializeArray();
        $.each(a, function() {
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
