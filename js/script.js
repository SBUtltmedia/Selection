  var currentUser;
  var comments = [];
  var replies = [];
  var whitelist;
  var range = {
      start: 0,
      end: 0
  };

  $(function() {

      //some initialization code
      rangy.init();
      $('#dialog').on("click", function(e) {
          e.stopPropagation();
      });
      $('.annotationType').on("click", function(e) {
          filterCommentType($(this).text().toLowerCase());
          $('.annotationType').removeClass("active");
          $(this).addClass("active");
      });
      //CKEDITOR.replace("editor");
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
              whitelist = commentData.whitelist.map(normalizeWhitelist);
              currentUser = commentData.netid;

              commentData.allUsers.forEach(function(element) {
                  $('.nameList').append("<span>" + element.name + "</span>");
              });

              $('.nameList span').on("click", function(e) {
                  filterCommentByName($(this).text());
              });

              console.log(commentData);
              commentData.allUsers.forEach(function(element) {
                  console.log(element);
                  element.comments.forEach(function(comment, index) {
                      comments.push(comment);
                  })
              });
              commentData.replies.forEach(function(reply) {
                  replies.push(reply);
              });
              console.log(comments);
              console.log(replies);
              deferred.resolve();
          })
          return deferred.promise();
      }

      //filters out all of the comments that do not match the given type
      function filterCommentType(type) {
          restoreHighlights();
          if (type !== "all") {
              removedComments = comments.filter(function(element) {
                  return !element.commentType || element.commentType.toLowerCase() !== type;
              });
              removedComments.forEach(function(element) {
                  unhighlightComment(element.commentID);
              });
          }
      }

      //filters out all of the comments were not created by the given user
      function filterCommentByName(name) {
          restoreHighlights();
          removedComments = comments.filter(function(element) {
              return !element.netid || element.netid.toLowerCase() !== name;
          });
          removedComments.forEach(function(element) {
              unhighlightComment(element.commentID);
          });
      }

      //ensures that the whitelist is all lowercase letters so that its easier to compare values to
      function normalizeWhitelist(netid) {
          return netid.toLowerCase();
      }

      //sets the visibility modifiers of the form to be visible and shows the checkbox to allow highlights to show up for people on the whitelist
      function showForm() {
          $("#dialog").css({
              "visibility": "visible"
          });
          if (whitelist.indexOf(currentUser) > -1) {
              $('#visibility').css("visibility", "visible");
          }
      }

      //sets the visibility modifiers of the form to be hidden
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
              //console.log(whitelist);
              if (comment.visible || currentUser === comment.netid || whitelist.indexOf(currentUser) > -1) {
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
              open: makeCKEditor,
              width: 500,
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
                          postContent(commentID);
                          cleanCKEditor().then($(this).dialog("close"));
                          $("#commentForm")[0].reset();
                      }
                  }
              ],
              title: "Annotation by: " + currentUser,
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
                      let comment = getComment(commentID);
                      $("#commentForm :input").prop("disabled", true);
                      $("#dialog").dialog({
                          dialogClass: "no-close",
                          minHeight: 0,
                          maxHeight: 350,
                          width: 500,
                          create: function() {
                              $(this).css("maxHeight", 100);
                          },
                          open: makeCKEditor,
                          buttons: [{
                              text: "Close",
                              click: function() {
                                  $(this).css({
                                      "visibility": "hidden"
                                  });
                                  $(this).dialog("close");
                              }
                          }],
                          title: "Annotation by: " + comment.netid
                      });
                      $("#replyButton").css({
                          "visibility": "visible"
                      });
                      moveDialogToMouse(e);
                  } else if (commentMadeByUser(commentID, currentUser)) { // case where the comment was madw by the current user
                      let comment = getComment(commentID);
                      range.start = comment.start;
                      range.end = comment.end;
                      $("#commentForm :input").prop("disabled", false);
                      $("#dialog").dialog({
                          dialogClass: "no-close",
                          minHeight: 0,
                          maxHeight: 350,
                          width: 500,
                          open: makeCKEditor,
                          buttons: [{
                                  text: "Save",
                                  click: function() {
                                      $(this).css({
                                          "visibility": "hidden"
                                      });
                                      postContent(commentID).then(cleanCKEditor())
                                          .then($(this).dialog("close"));
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
                                      cleanCKEditor().then($(this).dialog("close"));
                                  }
                              },
                              {
                                  text: "Close",
                                  click: function() {
                                      $(this).css({
                                          "visibility": "hidden"
                                      });
                                      cleanCKEditor().then($(this).dialog("close"));
                                  }
                              },
                              {
                                  text: "Add",
                                  "class": "rightButton",
                                  click: function() {
                                      addNewThreadToHighlight();
                                  }
                              }
                          ],
                          title: "Annotation by: " + comment.netid
                      });
                      $("#replyButton").css({
                          "visibility": "visible"
                      });
                      moveDialogToMouse(e);
                  } else { //case where the current user did not create the comment and is on the whitelist
                      let comment = getComment(commentID);
                      range.start = comment.start;
                      range.end = comment.end;
                      $("#commentForm :input").prop("disabled", true);
                      $("#visibility :input").prop("disabled", false);
                      $("#dialog").dialog({
                          dialogClass: "no-close",
                          minHeight: 0,
                          maxHeight: 350,
                          width: 500,
                          open: makeCKEditor,
                          buttons: [{
                                  text: "Save",
                                  click: function() {
                                      $(this).css({
                                          "visibility": "hidden"
                                      });
                                      postContent(commentID, false, true);
                                      cleanCKEditor().then($(this).dialog("close"));
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
                                      cleanCKEditor().then($(this).dialog("close"));
                                  }
                              },
                              {
                                  text: "Close",
                                  click: function() {
                                      $(this).css({
                                          "visibility": "hidden"
                                      });
                                      cleanCKEditor().then($(this).dialog("close"));
                                  }
                              },
                              {
                                  text: "Add",
                                  "class": "rightButton",
                                  click: function() {
                                      addNewThreadToHighlight();
                                  }
                              }
                          ],
                          title: "Annotation by: " + comment.netid
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
          fillCommentInfo("commentForm", comment);

          let replies = getReplies(commentID);
          replies.sort(function(a, b) {
              return a.number - b.number;
          });
          replies.forEach(function(reply) {
              let form = getForm();
              if (reply.parent) {
                  appendToCommentThread(reply.parent, reply.number, form);
              } else {
                  addNewThreadToHighlight();
              }
              fillCommentInfo("commentForm_" + reply.number, reply);
              if (reply.netid != currentUser) {
                  $("#commentForm_" + reply.number + " :input").prop("disabled", true);
              }
          });
          initReply();
          showForm();
      }

      //fills in the info in the form with id formID with the information in comment
      function fillCommentInfo(formID, comment) {
          for (i in comment) {
              if ($("#" + formID + " input[name=" + i + "]").is(":radio")) {
                  $("#" + formID + " [name=" + i + "]").attr('checked', false);
                  $("#" + formID + " input[name=" + i + "][value='" + comment[i] + "']").attr('checked', true);
              } else if ($("#" + formID + "input[name=" + i + "]").is(":checkbox")) {
                  $("#" + formID + " input[name=" + i + "]").attr('checked', true);
              } else {
                  $("#" + formID + " [name=" + i + "]").val(comment[i]);
                  //console.log(i + ": " + comment[i]);
              }
          }
      }

      //gets the comment with the correct commentID
      function getComment(commentID) {
          var com = comments.find(function(item) {
              return item.commentID == commentID;
          });
          return com;
      }

      //returns the comment with the id of commentID and has given number
      function getReply(commentID, number) {
          var com = replies.find(function(item) {
              return item.commentID == commentID && item.number == number;
          });
          return com;
      }

      //returns a list of all the comments besides the main one in the comment thread with the id commentID
      function getReplies(commentID) {
          var com = replies.filter(function(item) {
              return item.commentID == commentID;
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
          form.replace("editor", "editor_" + count);
          let parentID = (e.target.id.split("_")[1]) ? "commentFormItem_" + e.target.id.split("_")[1] : "commentFormItem";
          console.log(parentID);
          appendToCommentThread(parentID, count, form);
          $("#commentForm_" + count + " :input").prop("disabled", false);
          initReply();
          $("#commentForm_" + count + " > input[name=parent]").val(parentID);
          $("#commentForm_" + count + " [name=netid]").val("");
      }

      //creates a new thread in the highlight comments
      function addNewThreadToHighlight() {
          let count = getNumberOfComments();
          let form = getForm();
          form.replace("editor", "editor_" + count);
          $("#commentList").append('<hr><li id="commentFormItem_' + count + '" class="comment">' + form + '</li>');
          initReply();
          cleanCKEditor().then(makeCKEditor());
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
              addLevelToCommentThread(parentID, count, form);
          } else {
              $("#thread_" + parentID + " ul").append('<hr><li id="commentFormItem_' + count + '" class="comment">' + form + '</li>');
          }
          cleanCKEditor().then(makeCKEditor());

      }

      //adds another level of comments/replies to the comment thread
      function addLevelToCommentThread(parentID, count, form) {
          $("#" + parentID).after('<li id="thread_' + parentID + '"><ul><hr><li id="commentFormItem_' + count + '" class="comment">' + form + '</li></ul></li>');
      }

      //gets all the html for the form so that it can be used again in replies/threads
      function getForm() {
          let form = '<form class="form" style="z-index:10000" id="commentForm" autocomplete="off"><textarea name="commentText" class="commentField" id="editor" rows="5" cols="80"></textarea><input type="hidden" name="commentID"><input type="hidden" name="start"><input type="hidden" name="end"><input type="hidden" name="parent"><input type="hidden" name="number"><input type="hidden" name="remove"><input type="hidden" name="netid"></form><button class="reply" type="button" id="replyButton">Reply</button><br>';
          let count = getNumberOfComments();
          form = form.replace(/"commentForm"/, '"commentForm_' + count + '"');
          form = form.replace(/"replyButton"/, '"replyButton_' + count + '"');
          form = form.replace(/"editor"/, '"editor_' + count + '"');
          return form;
      }

      //function that deletes all ckeditor instances so that the form modal can properly be closed
      function cleanCKEditor() {
          var deferred = new $.Deferred();
          for (name in CKEDITOR.instances) {
              CKEDITOR.instances[name].destroy(true);
          }
          deferred.resolve();
          return deferred.promise();
      }

      //function to be called when dialog opens so that they have ckeditors instead of textareas
      function makeCKEditor(e, ui) {
          let commentNum = getNumberOfComments();
          if (commentNum > 1) {
              CKEDITOR.replace("editor_" + (commentNum - 1));
              for (let i = 1; i < commentNum; i++) {
                  if (!$("#editor_" + i).is(":hidden")) {
                      $("#editor_" + i).hide();
                      $("#editor_" + i).after($("#editor_" + i).val());
                  }
              }
              if (!$("#editor").is(":hidden")) {
                  $("#editor").after($("#editor").val());
                  $("#editor").hide();
              }
          } else {
              CKEDITOR.replace("editor");
          }
      }

      //sends the comment information to save.php or update.php in order to be saved to the file system
      function postContent(commentID, remove = false, update = false) {
          var deferred = new $.Deferred();
          $("#commentForm :input").prop("disabled", false);
          var data = $("#commentForm").serializeFormJSON();
          console.log(data);
          data.start = range.start;
          data.end = range.end;
          data.netid = commentID.split("_")[0];
          data.commentID = commentID;
          data.number = 0;
          data.remove = remove ? "true" : "";
          data.commentText = CKEDITOR.instances.editor.getData();
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
          console.log(data);

          //sends out the replies to comments to save.php to be saved
          for (var i = 1; i < getNumberOfComments(); i++) {
              $("#commentForm_" + i + " :input").prop("disabled", false);
              var data = $("#commentForm_" + i).serializeFormJSON();
              console.log(data);
              data.start = range.start;
              data.end = range.end;
              data.netid = ($("#commentForm_" + i + " [name=netid]").val().length == 0) ? "" : $("#commentForm_" + i + " [name=netid]").val();
              data.commentID = commentID;
              data.remove = remove ? "true" : "";
              data.number = i;
              console.log(CKEDITOR.instances["editor_" + i]);
              data.commentText = CKEDITOR.instances["editor_" + i].getData();
              if (getComment(commentID)) {
                  if (remove) {
                      let index = replies.indexOf(getReply(commentID, i));
                      if (index > -1) {
                          replies.splice(replies.indexOf(getReply(commentID, i)), 1);
                      }
                  } else {
                      let index = replies.indexOf(getReply(commentID, i));
                      if (index > -1) {
                          replies[index] = data;
                      } else {
                          replies.push(data);
                      }
                  }
              } else if (!remove) {
                  replies.push(data);
              }
              $.post("save.php", {
                  data: JSON.stringify(data)
              });
          }
          console.log(replies);

          $("#commentForm")[0].reset();
          deferred.resolve();
          return deferred.promise();
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
