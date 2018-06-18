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
              if($("." + commentID).length > 0) {
                unhighlightComment(commentID);
              }
              highlightRange(selectedRange, commentID);
              highlightPrompt(e, commentID);
          }
      }

      //highlights a given range object by creating spans with the class hl+id
      function highlightRange(range, id) {
          let applierCount = rangy.createClassApplier("hl" + id, {useExistingElements: false});
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

      function moveDialogToHighlight(commentID) {
          $("#dialog").dialog("option", "position", {
              my: "left top",
              at: "left top",
              of: $('#textFrame').contents().find("." + commentID)
          });
      }

      //attaches an onlick listener to the highlights so that the information associated with the highlight shows up
      function linkComments(commentID) {
          $('#textFrame').ready(function() {
              $("#textFrame").contents().find(".hl" + commentID).on("click", function (e) {
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
                  } else if (commentMadeByUser(commentID, currentUser)) {
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
                                      addCommentToForm();
                                  }
                              }
                          ]
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
              return item.commentID == commentID;
          });
          return com;
      }

      function resetCommentForm() {
          $("#commentList").empty();
          $("#dialog ul").append('<li id="commentFormItem"><form class="form" style="z-index:10000" id="commentForm" autocomplete="off"><input type="text" name="name"><p id="visibility"><input type="checkbox" name="visible">Visible</p><br><input type="text" name="field1"><br><input type="hidden" name="commentID"><input type="hidden" name="start"><input type="hidden" name="end"><input type="hidden" name="parent"><input type="hidden" name="remove"><input type="hidden" name="netid"><input type="text" name="field2"><br><input type="radio" value="Yes?" name="field3" checked>Yes?<br><input type="radio" value="No?" name="field3">No?<br><input type="radio" value="Maybe So?" name="field3">Maybe So?<br><select name="field4"><option value="volvo">olvo</option><option value="saab">Saa</option><option value="opel">pel</option><option value="audi">Adi</option></select><br><!--<input type="submit">--></form></li>');

      }

      function addCommentToForm() {
        $("#dialog ul").append('<li id="commentFormItem1"><form class="form" style="z-index:10000" id="commentForm1" autocomplete="off"><input type="text" name="name"><p id="visibility"><input type="checkbox" name="visible">Visible</p><br><input type="text" name="field1"><br><input type="hidden" name="commentID"><input type="hidden" name="start"><input type="hidden" name="end"><input type="hidden" name="parent"><input type="hidden" name="remove"><input type="hidden" name="netid"><input type="text" name="field2"><br><input type="radio" value="Yes?" name="field3" checked>Yes?<br><input type="radio" value="No?" name="field3">No?<br><input type="radio" value="Maybe So?" name="field3">Maybe So?<br><select name="field4"><option value="volvo">olvo</option><option value="saab">Saa</option><option value="opel">pel</option><option value="audi">Adi</option></select><br><!--<input type="submit">--></form></li>');
      }

      //sends the comment information to save.php or update.php in order to be saved to the file system
      function postContent(commentID, remove = false, update = false) {
          var data = $("#commentForm").serializeFormJSON();
          data.start = range.start;
          data.end = range.end;
          data.netid = commentID.split("_")[0];
          data.commentID = commentID;
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
