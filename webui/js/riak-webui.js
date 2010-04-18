var keysTable;
var bucket_url;
$(function() {
	//$("#tabs").tabs();
	$("#msg").hide();
	$("button").button();
	$("#dialog").dialog("destroy");
	$("#navigation").accordion();
	keysTable = $('#keysTable').dataTable({
		"bJQueryUI": true,
		"sPaginationType": "full_numbers",
		"bAutoWidth": false,
		"aoColumns" : [
		    { sWidth: '1%', bSortable: false, sClass: 'center', bSearchable: false },
			{ sWidth: '99%', sClass: 'clickable' }
		]
	});
	$('#check_all').click( function() {
		var checked = this.checked;
		$('input', keysTable.fnGetNodes()).each(function() {
			$(this).attr('checked',checked);
			var tr = $(this).parent().parent();
			if (checked) {
				$(tr).addClass("row_selected");
			} else {
				$(tr).removeClass("row_selected");
			}
		});
	});
	
	$("#delete_btn").click(function(){
		var selectedRows = $("#keysTable tbody tr.row_selected");
		if ($(selectedRows).length == 0) {
			// nothing to delete
			return false;
		}
		 // create confirmation
		var dialog="<div id='confirmation' title='Confirmation'>"
			+ "<p>Are you sure to delete the selected keys?</p>"
			+ "</div>";
		$("#main").append(dialog);
		$("#confirmation").dialog({
			resizable: false,
			height: 140,
			width: 320,
			modal: true,
			closeOnEscape: false,
			open: function(event, ui) { $(".ui-dialog-titlebar-close").hide(); }, // remove close button
			buttons: {
				'Delete all items': function() {
					delete_keys(selectedRows);
					$(this).dialog("option", "title", "Executing")
					$(this).dialog( "option" , "buttons" , []);
					$(this).dialog( "option" , "height", 85);	
					//$(this).dialog('disable');
				},
				'Cancel': function() {
					$("#confirmation").dialog('destroy');
					$("#confirmation").remove();
				}
			}
		});
	});
	
	$("#retrieve_btn").click(function(){
		keysTable.fnClearTable();
		$('#msg').removeClass("error");
		$('#msg').removeClass("success");
		$('#msg').text('');
		bucket_url = $('#riak_server').val() + "/" + $('#bucket').val();
		var url = bucket_url + "?props=false";
		$.ajax({url: url, success: function(data, textStatus, xhr){
			$("#msg").show();
			if (data.keys == undefined) {
				$('#msg').addClass("error");
				$('#msg').text('Failed. Data has no keys');
				return;
			} else {
				$('#msg').addClass("success");
				$('#msg').text('Success');						
			}

			$.each(data.keys, function(id){
				keysTable.fnAddData([
					"<input type='checkbox' name='keysCheckBox' />",
					data.keys[id]
					]);
			});
			
			$('input', keysTable.fnGetNodes()).click(function(){
				var tr = $(this).parent().parent();
				if (this.checked) {
					$(tr).addClass("row_selected");
				} else {
					$(tr).removeClass("row_selected");
				}
			});
			// handle clickable keys
			$("#keysTable tbody tr td.clickable").click(function(){
				var url = "http://" + window.location.host + bucket_url + "/" + $(this).text();
				window.open(url);
				return false;
			});
		
		}});
	});
});

function delete_keys(selectedRows) {
	var total = $(selectedRows).length;
	var count = 0;
	$("#confirmation").html("Deleting " + total + " keys...<br/><div id='progressbar'></div>");
	$("#progressbar").progressbar({
				value: 0
	});
	// get all keys from table and delete one by one sync
	$(selectedRows).each(function(){
		var tr = this;
		var pos = keysTable.fnGetPosition(tr);
		var data = keysTable.fnGetData(pos);
		var key = data[1];
		$.ajax({
			type: 'DELETE', 
			aysnc: false, 
			url: bucket_url + "/" + key,
			success: function(result) {
				keysTable.fnDeleteRow(pos);
				$(tr).removeClass("row_selected");
				count++;
				$("#progressbar").progressbar("value", count*100/total);
				if (count == total) {
					$("#confirmation").html("Done!!");
					$("#confirmation").dialog("option", "title", "Completed");
					$("#confirmation").dialog("option", "height", 85);
					$("#confirmation").dialog("option", "buttons", {OK: function() {
						$("#confirmation").dialog('destroy');
						$("#confirmation").remove();
					}});
				}
			}
		});
	});
}