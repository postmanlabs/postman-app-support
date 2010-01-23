function clearFields() {
  $("#response").css("display", "");
  $("#loader").css("display", "");
  $("#responsePrint").css("display", "none");

  $("#responseStatus").html("");
  $("#responseHeaders").val("");
  $("#responseData").val("");
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
      $("#responseStatus").html("<span style=\"color:#FF0000\">"+chrome.i18n.getMessage("bad_request")+"</span>");
      $("#respHeaders").css("display", "none");
      $("#respData").css("display", "none");
    
      $("#loader").css("display", "none");
      $("#responsePrint").css("display", "");
    }
  } else {
    $("#responseStatus").html("<span style=\"color:#FF0000\">"+chrome.i18n.getMessage("bad_request")+"</span>");
    $("#respHeaders").css("display", "none");
    $("#respData").css("display", "none");

    $("#loader").css("display", "none");
    $("#responsePrint").css("display", "");
  }
}

function readResponse() {
  if (this.readyState == 4) {
    try {
      $("#responseStatus").html(this.status);
      $("#responseHeaders").val(this.getAllResponseHeaders());
      $("#responseData").val(this.responseText);
      $("#respHeaders").css("display", "");
      $("#respData").css("display", "");

      $("#loader").css("display", "none");
      $("#responsePrint").css("display", "");
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