  var currentUser;
  var comments = [];
  var count = 0;
  var serial;
  var range = {
      start: 0,
      end: 0
  };

  $(function() {

      rangy.init();
      var applierCount = rangy.createClassApplier("hl" + count);

      $('#textFrame').on("load", function(e) {
          $('#textFrame').contents().find('#text').css("pointer-events", "all");
          $('#textFrame').contents().find('#text').on("mouseup", function(e) {
              highlightCurrentSelection(e);
          });
          loadData().then(restoreHighlights);
      });
      highlightPrompt();
      $('#dialog').css({
          "visibility": "hidden"
      });
      $('#dialog').dialog("destroy");

      //parses the data coming in from the load.php file
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

      //returns the range object selected by the user
      function getFirstRange() {
          let sel = rangy.getSelection(document.getElementById('textFrame'));
          return sel.rangeCount ? sel.getRangeAt(0) : null;
      }

      //applies the highlight to the area selected by the user
      function highlightCurrentSelection(e) {
          var selectedRange = getFirstRange();
          if (selectedRange.endOffset != selectedRange.startOffset) {
              console.log(selectedRange);
              serial = rangy.serializeRange(selectedRange);
              range = selectedRange.toCharacterRange();
              highlightRange(selectedRange, currentUser + "_" + count);
              count++;
              highlightPrompt(e);
          }
      }

      //highlights a given range object by creating spans with the class hl+id
      function highlightRange(range, id) {
          applierCount = rangy.createClassApplier("hl" + id);
          applierCount.applyToRange(range);
          linkComments(id);
      }

      //gets the range associated with the text area
      function getTextRange() {
        let doc = (document.getElementById("textFrame").contentDocument) ? document.getElementById("textFrame").contentDocument : document.getElementById("textFrame").contentWindow.document;
        let el = doc.getElementById("text");
        let range = rangy.createRange();
        range.selectNodeContents(el);
        return range;
      }

      //removes the highlight with the number count at the end from the current user's highlights
      function unhighlightCount(count) {
          applierCount = rangy.createClassApplier("hl" + currentUser + "_" + count);
          let range = getTextRange();
          applierCount.undoToRange(range);
      }

      //removes the highlight with the commentID
      function unhighlightComment(commentID) {
          applierCount = rangy.createClassApplier("hl" + commentID);
          let range = getTextRange();
          applierCount.undoToRange(range);
      }

      //unhighlights the last highlighted range
      function unhighlightPreviousRange() {
          unhighlightCount(--count);
      }

      //unhighlights everything the current user has highlighted
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

      //brings up the prompt for inputting information into highlight comments
      function highlightPrompt(e) {
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
          moveDialogToMouse(e);
      }

      //takes in a mouse event and sets the dialog position based on the location of the event
      function moveDialogToMouse(e) {
          $("#dialog").dialog("option", "position", {
              my: "left top",
              at: "left bottom",
              of: e
          });
      }

      //attaches an onlick listener to the highlights so that the information associated with the highlight shows up
      function linkComments(commentID) {
          console.log(commentID);
          $('#textFrame').ready(function() {
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
                      moveDialogToMouse(e);
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
                                      text: "Remove",
                                      click: function() {
                                          $(this).css({
                                              "visibility": "hidden"
                                          });
                                          unhighlightComment(commentID);
                                          removeContent(commentID.split("_")[1]);
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
                      moveDialogToMouse();
                  }
                  infoDialog(commentID);
              });
          });
      }

      //updates the information in the dialog to be the information associated with the comment
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

      //gets the comment with the correct commentID
      function getComment(commentNum) {
          var com = comments.find(function(item) {
              return item.count == commentNum;
          });
          return com;
      }

      //sends the comment information to save.php in order to be saved to the file system
      function postContent(IDNumber) {
          var data = $("#commentForm").serializeFormJSON();
          data.serial = serial;
          data.start = range.start;
          data.end = range.end;
          data.count = currentUser + "_" + IDNumber;
          console.log(data);
          if (getComment(currentUser + "_" + IDNumber)) {
              comments[comments.indexOf(getComment(currentUser + "_" + IDNumber))] = data;
          } else {
              comments.push(data);
          }
          $.post("save.php", {
              data: JSON.stringify(data)
          });
          previousRanges = [];
          $("#commentForm")[0].reset();
      }

      //removes the given comment from the file system
      function removeContent(IDNumber) {
          var data = $("#commentForm").serializeFormJSON();
          data.serial = serial;
          data.start = range.start;
          data.end = range.end;
          data.remove = "true";
          data.count = currentUser + "_" + IDNumber;
          console.log(data);
          if (getComment(currentUser + "_" + IDNumber)) {
              comments[comments.indexOf(getComment(currentUser + "_" + IDNumber))] = data;
          } else {
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
