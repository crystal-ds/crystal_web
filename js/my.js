/*!
 * Front end for Crystal A2C2
 * version 1.0
 * Requires jQuery v1.3.2 or later
 * Author: Arthur Liu（yikliu@umail.iu.edu)
 */
var ajaxServer =  'http://localhost:8080';
var rowCount = 4; // Tab1: each row has max of 4 elements
var allModels;

var selectedModelId = -1;
var batch_id = -1;
var title;
var aModel;
var inputs;
var description;

var input_type; 
var input_properties; 
var input_name;
var input_id;

$(document).ready(function() {	
	$('#SubmitInput').submit(function() {		
		var input_to_submit = allModels[selectedModelId.toString()]["inputs"];
		var id_no = 0;
		var submitdata = {};
		var model_id;
		
		jQuery.each(input_to_submit,function(){
				var thisValue;  
				var input_type = this["type"];
				id_no++;
				model_id = selectedModelId.toString();
				var myid = model_id+"_"+id_no;	
				if(document.getElementById(myid.toString())){
					var values = null;
					switch(input_type)
					{
						case "RANGESLIDER":
						  values = $('#'+myid).slider("option","values");	
						  this["properties"]["high"] = values[1];
						  this["properties"]["low"] = values[0];						  			  
						  break;
						case "CHECKBOX":
						  values =  $('#'+myid).is(':checked');
						  this["properties"]["value"] = values;
						  this["properties"]["checked"] = values;
						  break;			  
						case "INTEGER":
						case "SIMPLE":			  
						case "STRING":					  
						  values = $('#'+myid).val();
						  this["properties"]["value"] = values;
						  break;
						default:
						  console.log("Unknonw:" + input_type);
					}
				}			
				console.log(JSON.stringify(this));				
				submitdata[this["name"]] = this;
		});

		if(selectedModelId != -1){
			$.ajax({
				type: "POST",
				url: ajaxServer+'/crystal-a2c2/eme/models/'+selectedModelId+'/run',
				//data : '[{"InputNode1" : {"name" : "InputNode1","properties" : {"checked" : "true","value" : "true"},"id" : null,"type" : "CHECKBOX"},"InputNode2" : {"name" : "InputNode2","properties" : {"min" : "1","max" : "5","value" : "3"},"id" : null,"type" : "SIMPLE"},"InputNode3" : {"name" : "InputNode3","properties" : {"min" : "0", "max" : "10","high" : "7","low" : "5"}, "id" : null,"type" : "RANGESLIDER"}}]',
	    		data : '['+JSON.stringify(submitdata)+']',
	    		contentType : 'application/json',
	    		success: function(data){	    			
	    			batch_id = data["batchJob"];
	    			$('#rootwizard').bootstrapWizard('next');
	    		},
	    		error : function(jqXHR, textStatus, errorThrown){
	    			alert(errorThrown);
	    		},
				dataType: 'json'
			});	
		}		
	});

	$('#rootwizard').bootstrapWizard({
		onNext: function(tab, navigation, index) {
				if(index == 1){
					if(selectedModelId == -1){
						alert('Please select a model to proceed');
						return false;
					}
				}
				if(index == 2){
					if(batch_id == -1){
						alert('Model Run not yet finished');
						return false;
					}
				}
		}, 

		onTabShow: function(tab, navigation, index) {
				var $total = navigation.find('li').length;
				var $current = index+1;
				var $percent = ($current/$total) * 100;
				$('#rootwizard').find('.bar').css({width:$percent+'%'});
				if($current == 2){
					aModel=allModels[selectedModelId.toString()];
					description = aModel["description"];
					model_id = aModel["id"];
					inputs=aModel["inputs"];
					var id_no = 0;
					$(".control-group").remove();
					jQuery.each(inputs, function() {
  						var input_type = this["type"];
  						var input_name = this["name"];
  						var input_id = this["id"];
  						var input_properties = this["properties"];  
  						id_no++;			
  						var myid = model_id+"_"+id_no;			
  						var lbl = input_name;
  						switch(input_type)
						{
							case "CHECKBOX":							  
							  var checked = input_properties["checked"];
							  makeCheckbox(myid, lbl, checked);
							  break;
							case "INTEGER":
							case "SIMPLE":
							  var max = parseInt(input_properties["max"]);
							  var min = parseInt(input_properties["min"]); 
							  var value = parseInt(input_properties["value"]);
							  makeTextInput(myid,lbl,min,max,value);
							  break;
							case "RANGESLIDER":
							  var max = parseInt(input_properties["max"]);
							  var min = parseInt(input_properties["min"]);
							  var high = parseInt(input_properties["high"]);
							  var low = parseInt(input_properties["low"]);
							  makeSlider(myid, lbl, min, max, high, low);
							  break;
							case "STRING":
							  var regex = input_properties["regex"];
							  var value = input_properties["value"];
							  makeStringInput(myid,lbl,regex,value);
							  break;
							default:
							  console.log("Unknonw:" + input_type);
						}
					});

				}
				if($current == 3){
					$('#tab3').html(batch_id.toString());
				}
			}
		}

	);	
	

	window.prettyPrint && prettyPrint();

	$.ajax({
		type: 'GET',
		url: ajaxServer+'/crystal-a2c2/eme/models/',			
		dataType: 'json',
		crossDomain:true,
		error: function (jqXHR, textStatus, errorThrown) {
        	//alert(errorThrown);
    	},			
		success: function (data){	
			allModels = data;
			//console.dir(allModels);		
			var count = Object.keys(data).length;
			//var count = 13;
			var row = count <=rowCount ? 1 : count/rowCount;
			var str;
			var num;
			for (var i = 0; i < row ; i++){
				$('#tab1').append(
					$('<div>', {
						class: 'row-fluid',
						id:'row'+i						
					})
					);
				for(var j = 0; j < rowCount && count !=0 ; j++){
					num = i*4 + j + 1;
					title=allModels[num.toString()].name;
					str = '<div class="span'+12/rowCount+'" id="model'+num+'">'+title+'<img src="image.jpg" class="img-rounded" alt="Model'+num+'"></div>';
					jQuery(str).appendTo('#row'+i);
					count--;					
				}				
				jQuery("<hr>").appendTo('#tab1');	//add a separat line after each row			
			}

			$('[id^="model"]').click(function (){
				$('[id^="model"]').removeClass('seleted_model');
				$(this).addClass('seleted_model');
				selectedModelId = parseInt($(this).attr('id').substring(5));				
			});			
		}
	});		

});	


function makeCheckbox(id, lbl, defa){
	var checked = '';
	if(defa){
		checked='checked';
	}
	var html = '<div class="control-group"><label">'+lbl+'</label><label class="checkbox"><input id="'+ id +'" type="checkbox"'+checked+'>'+lbl+'</label><span class="help-block">Check for true; Uncheck for false</span></div>';
	//console.log(html);
	$(html).insertBefore('#tab2_submit');	
}

function getToolTip(id, value){
	var tooltip = '<div class = "mytooltip" id="tooltip'+id+'">'+value+'</div>';
	return tooltip;
}

function makeSlider(id, lbl, minimum, maximum, highest, lowest){
	var html = '<div class="control-group"><label">'+lbl+'</label><div id="'+id+'"></div><span class="help-block" id="slider_range"></span></div>';
	$(html).insertBefore('#tab2_submit');	
	$('#'+id).slider({
        range: true,
        min: minimum,
        max: maximum,
        values: [lowest, highest],        
	    slide: function(event, ui) {
	        //var values = $('#'+id).slider("option","values");
			var values = ui.values;
			for(var i = 0; i < 2; i++){
				$('#tooltip'+i).html(values[i].toString());
			}				    
	    },
	    create: function(event, ui) {
	    	var values = $('#'+id).slider("option","values");
	    	var tooltips = $(this).find(".tooltip");
	    	if(tooltips.length == 0){
	    		var handlers = $(this).find(".ui-slider-handle");
	    		if(handlers.length == 2){
	    			jQuery.each(handlers,function(idx, hdl){
	    				$(this).append(getToolTip(idx,values[idx]));				
					});
	    		}				
	    	}				    	
	    }
    });
}

function makeTextInput(id, lbl, min, max, v){
	var html = '<div class="control-group"><label for="inputSuccess">'+lbl+'</label><div><input type="text" id="'+id+'"><span class="help-block" id="text_help'+id+'"></span></div>';
	$(html).insertBefore('#tab2_submit');
	$('#'+id).val(v.toString());
	$('#'+id).blur(function() {
		var reg = new RegExp('^'+'\\d'+'+$'); //Integer only
  		var curVal = $(this).val();
  		if(reg.test(curVal)){
  			var value = parseInt($(this).val());   			
  			if(value < min || value > max){
  				$('#text_help'+id).html('Value Must Between ['+ min + ', '+max+']');
  			}else{
  				$('#text_help'+id).html('');
  			}
  		}
  		else{
  			$('#text_help'+id).html('Only Number is Allowed');
  		}
  		
  	});
}

function makeStringInput(id,lbl,regex,value){
	var html = '<div class="control-group"><label for="inputSuccess">'+lbl+'</label><div><input type="text" id="'+id+'"><span class="help-block" id="text_help'+id+'"></span></div>';
	$(html).insertBefore('#tab2_submit');
	$('#'+id).val(value);
	$('#'+id).blur(function() {
  		var reg = new RegExp('('+regex+')'+'\\b');
  		var curVal = $(this).val();
  		if(reg.test(curVal)){ 
  			$('#text_help'+id).html(''); 			
  		}else{
  			$('#text_help'+id).html('Only '+regex +' is allowed');
  		}
  	});
}