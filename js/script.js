  var currentUser;
  var comments = [];
  var count = 0;
  var serial;
  var range = {start:0, end: 0};

  $(function() {

      rangy.init();
      var applierCount = rangy.createClassApplier("hl" + count);

      $('#textFrame').on("load", function() {
          $('#textFrame').contents().find('#text').css("pointer-events", "all");
          $('#textFrame').contents().find('#text').on("mouseup", function(e) {
              highlightCurrentSelection();
          });
          loadData().then(restoreHighlights);
      });
      highlightPrompt();
      $('#dialog').css({
          "visibility": "hidden"
      });
      $('#dialog').dialog("destroy");


      function loadData() {
          var deferred = new $.Deferred();
          $.get('load.php', function(result) {
              commentData = JSON.parse(result);

              currentUser = commentData.netid;
              console.log(commentData);
              commentData.allUsers.forEach(function(element) {
                  console.log(element);
                  element.comments.forEach(function(comment, index) {
                      console.log(comment);
                      comments.push(comment);
                  })
              });
              deferred.resolve();
          })
          return deferred.promise();
      }

      $('#dialog').on("click", function(e) {
          e.stopPropagation();
      })

      $('html').on("mousedown", function() {
          //$('#text').css("pointer-events", "all");
      });

      $('form').on("submit", function(e) {
          e.preventDefault();
          postContent(count - 1);
          $("#dialog").dialog("close");
      });

      function getFirstRange() {
          let sel = rangy.getSelection(document.getElementById('textFrame'));
          return sel.rangeCount ? sel.getRangeAt(0) : null;
      }

      function highlightCurrentSelection() {
          var selectedRange = getFirstRange();
          if (selectedRange.endOffset != selectedRange.startOffset) {
              console.log(selectedRange);
              serial = rangy.serializeRange(selectedRange);
              range = selectedRange.toCharacterRange();
              highlightRange(selectedRange, currentUser + "_" + count);
              count++;
              highlightPrompt();
          }
      }

      function highlightRange(range, id) {
          applierCount = rangy.createClassApplier("hl" + id);
          applierCount.applyToRange(range);
          linkComments(id);
      }

      function unhighlightCount(count) {
          applierCount = rangy.createClassApplier("hl" + currentUser + "_" + count);
          let doc = (document.getElementById("textFrame").contentDocument) ? document.getElementById("textFrame").contentDocument : document.getElementById("textFrame").contentWindow.document;
          let el = doc.getElementById("text");
          let range = rangy.createRange();
          range.selectNodeContents(el);
          applierCount.undoToRange(range);
      }

      function unhighlightPreviousRange() {
          unhighlightCount(--count);
          console.log(count);
      }

      function removeAllHighlights() {
          while (count > 0) {
              unhighlightPreviousRange();
          }
      }

      function restoreHighlights() {
          console.log(currentUser);
          comments.forEach(function(comment) {
              $("#commentForm")[0].reset();
              let doc = (document.getElementById("textFrame").contentDocument) ? document.getElementById("textFrame").contentDocument : document.getElementById("textFrame").contentWindow.document;
              let el = doc.getElementById("text");
              let range = rangy.createRange();
              range.selectCharacters(el, comment.start, comment.end);
              highlightRange(range, comment.count);
              if (comment.netid === currentUser) {
                  count = parseInt(comment.count.split('_')[1]) + 1;
              }
          });
      }

      function highlightPrompt() {
          $("#commentForm")[0].reset();
          $("#commentForm :input").prop("disabled", false);
          $("#dialog").css({
              "visibility": "visible"
          });
          $("#dialog").dialog({
              dialogClass: "no-close",
              modal: true,
              buttons: [{
                      text: "Remove",
                      click: function() {
                          $(this).css({
                              "visibility": "hidden"
                          });
                          $(this).dialog("close");
                          unhighlightPreviousRange();
                      }
                  },
                  {
                      text: "Save",
                      click: function() {
                          $(this).css({
                              "visibility": "hidden"
                          });
                          $(this).dialog("close");
                          postContent(count - 1);
                          $("#commentForm")[0].reset();
                      }
                  }
              ]
          });
      }

      function linkComments(commentID) {
          console.log(commentID);
          $('#textFrame').ready(function() {
              console.log("hi");
              $("#textFrame").contents().find(".hl" + commentID).on("click", function(e) {
                  $("#dialog").css({
                      "visibility": "visible"
                  });
                  if (commentID.indexOf(currentUser) == -1) {
                      $("#commentForm :input").prop("disabled", true);
                      $("#dialog").dialog({
                          dialogClass: "no-close",
                          buttons: [{
                              text: "Close",
                              click: function() {
                                  $(this).css({
                                      "visibility": "hidden"
                                  });
                                  $(this).dialog("close");
                              }
                          }]
                      });
                  } else {
                      let comment = getComment(commentID);
                      range.start = comment.start;
                      range.end = comment.end;
                      $("#commentForm :input").prop("disabled", false);
                      $("#dialog").dialog({
                          dialogClass: "no-close",
                          buttons: [{
                                  text: "Save",
                                  click: function() {
                                      $(this).css({
                                          "visibility": "hidden"
                                      });
                                      postContent(commentID.split("_")[1]);
                                      $(this).dialog("close");
                                  }
                              },
                              {
                                  text: "Close",
                                  click: function() {
                                      $(this).css({
                                          "visibility": "hidden"
                                      });
                                      $(this).dialog("close");
                                  }
                              }
                          ]
                      });
                  }
                  infoDialog(commentID);
              });
          });
      }

      function infoDialog(commentID) {
          $("#commentForm")[0].reset();
          var comment = getComment(commentID);
          console.log(comment);
          for (i in comment) {
              if ($("input[name=" + i + "]").is(":radio")) {
                  console.log(comment[i]);
                  $("[name=" + i + "]").attr('checked', false);
                  $("input[name=" + i + "][value='" + comment[i] + "']").attr('checked', true);
              } else {
                  $("[name=" + i + "]").val(comment[i]);
              }
          }

          $("#dialog").css({
              "visibility": "visible"
          });
          $("#dialog").dialog();
      }

      function getComment(commentNum) {
          var com = comments.find(function(item) {
              return item.count == commentNum;
          });
          return com;
      }

      function postContent(IDNumber) {
          var data = $("#commentForm").serializeFormJSON();
          data.serial = serial;
          data.start = range.start;
          data.end = range.end;
          data.count = currentUser + "_" + IDNumber;
          console.log(data);
          if(getComment(currentUser + "_" + IDNumber)) {
            comments[comments.indexOf(getComment(currentUser + "_" + IDNumber))] = data;
          }
          else {
            comments.push(data);
          }
          $.post("save.php", {
              data: JSON.stringify(data)
          });
          previousRanges = [];
          $("#commentForm")[0].reset();
      }

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
