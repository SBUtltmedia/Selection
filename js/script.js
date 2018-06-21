  var currentUser;
  var comments = [];
  var whitelist;
  var range = {
      start: 0,
      end: 0
  };

  $(function() {

      rangy.init();
      $('#textFrame').on("load", function(e) {
          $('#textFrame').contents().find('#text').css("pointer-events", "none");
          $('#textFrame').contents().find('#text').on("mouseup", function(e) {
              highlightCurrentSelection(e);
          });
          loadData().then(restoreHighlights);
      });

      //parses the data coming in from the load.php file
      function loadData() {
          $(".loader").show();
          var deferred = new $.Deferred();
          $.get('load.php', function(result) {
              commentData = JSON.parse(result);
              whitelist = commentData.whitelist;
              currentUser = commentData.netid;
              console.log(commentData);
              commentData.allUsers.forEach(function(element) {
                  console.log(element);
                  element.comments.forEach(function(comment, index) {
                      comments.push(comment);
                  })
              });
              deferred.resolve();
          })
          return deferred.promise();
      }

      $('#dialog').on("click", function(e) {
          e.stopPropagation();
      });


      //sets the visibility modifiers of the form to be visible and shows the checkbox to allow highlights to show up for people on the whitelist
      function showForm() {
          $("#dialog").css({
              "visibility": "visible"
          });
          if (whitelist.indexOf(currentUser) > -1) {
              $('#visibility').css("visibility", "visible");
          }
      }

      //sets the visibility modiers of the form to be hidden
      function hideForm() {
          $("#dialog").css({
              "visibility": "hidden"
          });
          $('#visibility').css("visibility", "hidden");
      }

      //returns the highest number that is stored as an id in the current user's highlights
      function getHighestCommentID(netid) {
          var maxNum = -1;
          comments.forEach(function(comment) {
              if (comment.commentID.split("_")[0] === netid) {
                  let num = parseInt(comment.commentID.split('_')[1]);
                  if (num > maxNum) {
                      maxNum = num;
                  }
              }
          });
          return maxNum;
      }

      //checks if the given user is on the whitelist
      function isOnWhitelist(netid) {
          return whitelist.indexOf(currentUser) > -1;
      }

      //checks if the given comment was made by the given user
      function commentMadeByUser(commentID, netid) {
          return commentID.indexOf(netid) > -1;
      }

      //returns the range object selected by the user
      function getFirstRange() {
          let sel = rangy.getSelection(document.getElementById('textFrame'));
          return sel.rangeCount ? sel.getRangeAt(0) : null;
      }

      //applies the highlight to the area selected by the user
      function highlightCurrentSelection(e) {
          var selectedRange = getFirstRange();
          if (selectedRange.endOffset != selectedRange.startOffset) {
              e.stopImmediatePropagation();
              range = selectedRange.toCharacterRange();
              let commentID = currentUser + "_" + (getHighestCommentID(currentUser) + 1);
              console.log($('#textFrame').contents().find("." + commentID).length);
              if ($("." + commentID).length > 0) {
                  unhighlightComment(commentID);
              }
              highlightRange(selectedRange, commentID);
              highlightPrompt(e, commentID);
          }
      }

      //highlights a given range object by creating spans with the class hl+id
      function highlightRange(range, id) {
          let applierCount = rangy.createClassApplier("hl" + id, {
              useExistingElements: false
          });
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
          let applierCount = rangy.createClassApplier("hl" + currentUser + "_" + count);
          let range = getTextRange();
          applierCount.undoToRange(range);
      }

      //removes the highlight with the commentID
      function unhighlightComment(commentID) {
          let applierCount = rangy.createClassApplier("hl" + commentID);
          let range = getTextRange();
          applierCount.undoToRange(range);
      }

      //unhighlights the last highlighted range
      function unhighlightPreviousRange() {
          unhighlightCount(getHighestCommentID(currentUser) + 1);
      }

      //unhighlights everything the current user has highlighted
      function removeAllHighlights() {
          while (getHighestCommentID(currentUser) > 0) {
              unhighlightPreviousRange();
          }
      }

      //puts all of the old highlights back onto the page as long as they should be shown
      function restoreHighlights() {
          console.log(currentUser);
          comments.forEach(function(comment) {
              $("#commentForm")[0].reset();
              let doc = (document.getElementById("textFrame").contentDocument) ? document.getElementById("textFrame").contentDocument : document.getElementById("textFrame").contentWindow.document;
              let el = doc.getElementById("text");
              let range = rangy.createRange();
              range.selectCharacters(el, comment.start, comment.end);
              if (comment.visible === "on" || currentUser === comment.netid || whitelist.indexOf(currentUser) > -1) {
                  highlightRange(range, comment.commentID);
              }
          });
          $(".loader").hide();
          $('#textFrame').contents().find('#text').css("pointer-events", "all");
      }

      //brings up the prompt for inputting information into highlight comments
      function highlightPrompt(e, commentID) {
          $("#commentForm")[0].reset();
          $("#commentForm :input").prop("disabled", false);
          resetCommentForm();
          showForm();
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
                          postContent(commentID);
                          $("#commentForm")[0].reset();
                      }
                  }
              ]
          });
          $("#replyButton").css({
              "visibility": "hidden"
          });
          moveDialogToMouse(e);
      }

      //takes in a mouse event and sets the dialog position based on the location of the event
      function moveDialogToMouse(e) {
          $("#dialog").dialog("option", "position", {
              my: "left top",
              at: "left+" + e.clientX + " top+" + e.clientY,
              of: window,
              collision: "flip fit"
          });
      }

      //attaches an onlick listener to the highlights so that the information associated with the highlight shows up
      function linkComments(commentID) {
          $('#textFrame').ready(function() {
              $("#textFrame").contents().find(".hl" + commentID).on("click", function(e) {
                  console.log($(this).attr("class"));
              });
              $("#textFrame").contents().find(".hl" + commentID).on("click", function(e) {
                  resetCommentForm();
                  showForm();

                  //case where the current user didn't create the highlight and is not on the whitelist
                  if (!commentMadeByUser(commentID, currentUser) && !isOnWhitelist(currentUser)) {
                      $("#commentForm :input").prop("disabled", true);
                      $("#dialog").dialog({
                          dialogClass: "no-close",
                          minHeight: 0,
                          create: function() {
                              $(this).css("maxHeight", 100);
                          },
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
                      $("#replyButton").css({
                          "visibility": "visible"
                      });
                      moveDialogToMouse(e);
                  } else if (commentMadeByUser(commentID, currentUser)) {
                      let comment = getComment(commentID);
                      range.start = comment.start;
                      range.end = comment.end;
                      $("#commentForm :input").prop("disabled", false);
                      $("#dialog").dialog({
                          dialogClass: "no-close",
                          minHeight: 0,
                          maxHeight: 350,
                          buttons: [{
                                  text: "Save",
                                  click: function() {
                                      $(this).css({
                                          "visibility": "hidden"
                                      });
                                      postContent(commentID);
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
                                      postContent(commentID, true);
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
                              },
                              {
                                  text: "Add",
                                  "class": "rightButton",
                                  click: function() {
                                      addNewThreadToHighlight();
                                  }
                              }
                          ]
                      });
                      $("#replyButton").css({
                          "visibility": "visible"
                      });
                      moveDialogToMouse(e);
                  } else {
                      let comment = getComment(commentID);
                      range.start = comment.start;
                      range.end = comment.end;
                      $("#commentForm :input").prop("disabled", true);
                      $("#visibility :input").prop("disabled", false);
                      $("#dialog").dialog({
                          dialogClass: "no-close",
                          minHeight: 0,
                          create: function() {
                              $(this).css("maxHeight", 100);
                          },
                          buttons: [{
                                  text: "Remove",
                                  click: function() {
                                      $(this).css({
                                          "visibility": "hidden"
                                      });
                                      unhighlightComment(commentID);
                                      postContent(commentID, true);
                                      $(this).dialog("close");
                                  }
                              },
                              {
                                  text: "Close",
                                  click: function() {
                                      $(this).css({
                                          "visibility": "hidden"
                                      });
                                      postContent(commentID, false, true);
                                      $(this).dialog("close");
                                  }
                              }
                          ]
                      });
                      $("#replyButton").css({
                          "visibility": "visible"
                      });
                      moveDialogToMouse(e);
                  }
                  infoDialog(commentID);
              });
          });
      }

      //updates the information in the dialog to be the information associated with the comment
      function infoDialog(commentID) {
          $("#commentForm")[0].reset();
          var comment = getComment(commentID);
          $("input").attr('checked', false);
          for (i in comment) {
              if ($("input[name=" + i + "]").is(":radio")) {
                  $("[name=" + i + "]").attr('checked', false);
                  $("input[name=" + i + "][value='" + comment[i] + "']").attr('checked', true);
              } else if ($("input[name=" + i + "]").is(":checkbox")) {
                  $("input[name=" + i + "]").attr('checked', true);
              } else {
                  $("[name=" + i + "]").val(comment[i]);
              }
          }

          showForm();
      }

      //gets the comment with the correct commentID
      function getComment(commentID) {
          var com = comments.find(function(item) {
              return item.commentID == commentID && item.number == 0;
          });
          return com;
      }

      function getReplies(commentID) {
        var com = comments.filter(function(item) {
            return item.commentID == commentID && item.number > 0;
        });
        return com;
      }

      //empties the comment dialog so that it only has the base form
      function resetCommentForm() {
          let form = $("#commentFormItem").html();
          $("#commentList").empty();
          $("#dialog ul").append('<li id="commentFormItem" class="comment">' + form + '</li>');
          initReply();

      }

      //adds a reply to a comment
      function addCommentToForm(e) {
          let count = getNumberOfComments();
          let form = getForm();
          let parentID = (e.target.id.split("_")[1]) ? "commentFormItem_" + e.target.id.split("_")[1] : "commentFormItem";
          console.log(parentID);
          appendToCommentThread(parentID, count, form);
          initReply();
          $("#commentForm_" + count + " > input[name=parent]").val(parentID);
      }

      //creates a new thread in the highlight comments
      function addNewThreadToHighlight() {
          let count = getNumberOfComments();
          let form = getForm();
          $("#commentList").append('<hr><li id="commentFormItem_' + count + '" class="comment">' + form + '</li>');
          initReply();
      }

      //returns the number of comments in the current highlighted section
      function getNumberOfComments() {
          return $(".comment").length;
      }

      //applies the onclick listener to all of the reply buttons
      function initReply() {
          $(".reply").off("click");
          $(".reply").on("click", function(e) {
              addCommentToForm(e);
          });
      }

      //adds a reply to a given commentID
      function appendToCommentThread(parentID, count, form) {
          if ($("#thread_" + parentID).length == 0) {
              console.log("what");
              addLevelToCommentThread(parentID, count, form);
          } else {
              $("#thread_" + parentID + " ul").append('<hr><li id="commentFormItem_' + count + '" class="comment">' + form + '</li>');
          }
      }

      //adds another level of comments/replies to the comment thread
      function addLevelToCommentThread(parentID, count, form) {
          console.log("parentID is " + parentID);
          $("#" + parentID).after('<li id="thread_' + parentID + '"><ul><hr><li id="commentFormItem_' + count + '" class="comment">' + form + '</li></ul></li>');
      }

      //gets all the html for the form so that it can be used again in replies/threads
      function getForm() {
          let form = $("#commentFormItem").html();
          let count = getNumberOfComments();
          form = form.replace(/"commentForm"/, '"commentForm_' + count + '"');
          form = form.replace(/"replyButton"/, '"replyButton_' + count + '"');
          return form;
      }

      //sends the comment information to save.php or update.php in order to be saved to the file system
      function postContent(commentID, remove = false, update = false) {
          var data = $("#commentForm").serializeFormJSON();
          data.start = range.start;
          data.end = range.end;
          data.netid = commentID.split("_")[0];
          data.commentID = commentID;
          data.number = 0;
          data.remove = remove ? "true" : "";
          if (getComment(commentID)) {
              if (remove) {
                  comments.splice(comments.indexOf(getComment(commentID)), 1);
              } else {
                  comments[comments.indexOf(getComment(commentID))] = data;
              }
          } else if (!remove) {
              comments.push(data);
          }
          if (update) {
              $.post("update.php", {
                  data: JSON.stringify(data)
              });
          } else {
              $.post("save.php", {
                  data: JSON.stringify(data)
              });
          }

          for(var i=1; i<getNumberOfComments(); i++) {
            var data = $("#commentForm_"+i).serializeFormJSON();
            data.start = range.start;
            data.end = range.end;
            data.netid = commentID.split("_")[0];
            data.commentID = commentID;
            data.remove = remove ? "true" : "";
            data.number = i;
            $.post("saveReplies.php", {
                data: JSON.stringify(data)
            });
            console.log("something");
          }

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
