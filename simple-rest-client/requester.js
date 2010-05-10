function grow(id) {
  var textarea = document.getElementById(id);
  var newHeight = textarea.scrollHeight;
  var currentHeight = textarea.clientHeight;
  if (newHeight == 0 || $("#"+id).val() == "") {
    newHeight = 20;
  }
  textarea.style.height = newHeight + 'px';
}

function clearFields() {
  $("#response").css("display", "");
  $("#loader").css("display", "");
  $("#responsePrint").css("display", "none");

  $("#responseStatus").html("");
  $("#responseHeaders").val("");
  $("#codeData").text("");

  $("#responseHeaders").height(20);
  $("#headers").height(20);
  $("#postputdata").height(20);

  $("#respHeaders").css("display", "none");
  $("#respData").css("display", "none");
}

function sendRequest() {
  clearFields();
  if($("#url").val() != "") {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = readResponse;
    try {
      xhr.open($("input[type=radio]:checked").val(), $("#url").val(), true);
      var headers = $("#headers").val();
      headers = headers.split("\n");
      for (var i = 0; i < headers.length; i++) {
        var header = headers[i].split(": ");
        if (header[1])
            xhr.setRequestHeader(header[0],header[1]);
      }
      if(jQuery.inArray($("input[type=radio]:checked").val(), ["post", "put"]) > -1) {
        xhr.send($("#postputdata").val());
      } else {
        xhr.send("");
      }
    }
    catch(e){
      console.log(e);
      $("#responseStatus").html("<span style=\"color:#FF0000\">"+chrome.i18n.getMessage("bad_request")+"</span>");
      $("#respHeaders").css("display", "none");
      $("#respData").css("display", "none");

      $("#loader").css("display", "none");
      $("#responsePrint").css("display", "");
    }
  } else {
    console.log("no uri");
    $("#responseStatus").html("<span style=\"color:#FF0000\">"+chrome.i18n.getMessage("bad_request")+"</span>");
    $("#respHeaders").css("display", "none");
    $("#respData").css("display", "none");

    $("#loader").css("display", "none");
    $("#responsePrint").css("display", "");
  }
}

function readResponse() {
  grow('headers');
  grow('postputdata');
  if (this.readyState == 4) {
    try {
      if(this.status == 0) {
        throw('Status = 0');
      }
      $("#responseStatus").html(this.status);
      $("#responseHeaders").val(jQuery.trim(this.getAllResponseHeaders()));
      var debugurl = /X-Debug-URL: (.*)/i.exec($("#responseHeaders").val());
      if (debugurl) {
	  $("#debugLink").attr('href', debugurl[1]).html(debugurl[1]);
	  $("#debugLinks").css("display", "");
      }
      $("#codeData").html(jQuery.trim(this.responseText).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));

      $("#respHeaders").css("display", "");
      $("#respData").css("display", "");

      $("#loader").css("display", "none");
      $("#responsePrint").css("display", "");

      grow('responseHeaders');

      $.chili.options.automatic.active = false;
      $.chili.options.decoration.lineNumbers = false;
      var $chili = $('#codeData').chili();
    }
    catch(e) {
      $("#responseStatus").html("No response.");
      $("#respHeaders").css("display", "none");
      $("#respData").css("display", "none");

      $("#loader").css("display", "none");
      $("#responsePrint").css("display", "");
    }
  }
}

function toggleData() {
  if(jQuery.inArray($("input[type=radio]:checked").val(), ["post", "put"]) > -1) {
    $("#data").css("display", "");
  } else {
    $("#data").css("display", "none");
  }
}

function init() {
  $("#url").width($("#purl").width()-80-30);
  $("#headers").width($("#pheaders").width()-80-30);
  $("#postputdata").width($("#data").width()-80-30);

  $("#responseHeaders").width($("#respHeaders").width()-80-30);
  $("#responseData").width($("#respHeaders").width()-80-30);

  $("#response").css("display", "none");
  $("#loader").css("display", "");
  $("#responsePrint").css("display", "none");
  $("#sep").css("display", "none");

  $("#data").css("display", "none");

  $("#responseStatus").html("");
  $("#respHeaders").css("display", "none");
  $("#respData").css("display", "none");

  $("#submit").click(function() { sendRequest(); return false; });
  $("#reset").click(function() { location.reload(); });
  $(".radio").change(function() { toggleData(); });
  $(".radio").focus(function() { toggleData(); });
}

function lang() {
  $('._msg_').each(function () {
    var val = $(this).html();
    $(this).html(chrome.i18n.getMessage(val));
  });
  $('._msg_val_').each(function () {
    var val = $(this).val();
    $(this).val(chrome.i18n.getMessage(val));
  });
}

$(document).ready(function() {
  lang();
  init();
});