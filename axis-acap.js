//Copyright (c) 2021 Fred Juhlin

const VapixWrapper = require('vapix-wrapper');

module.exports = function(RED) {
	function Axis_ACAP(config) {
//		console.log("Axis_ACAP");
		RED.nodes.createNode(this,config);
		this.preset = config.preset;
		this.action = config.action;
		this.acap = config.acap;
		this.filename = config.filename;
		var node = this;
		node.on('input', function(msg) {
			node.status({});
			var device = {
				address: null,
				user: null,
				passwaord: null,
				protocol: "http"
			}
			var preset = RED.nodes.getNode(node.preset);
			if( preset ) {
				device.address = preset.address;
				device.user = preset.credentials.user;
				device.password = preset.credentials.password;
				device.protocol = preset.protocol || "http";
			}

			if( msg.address ) device.address = msg.address;
			if( msg.user ) device.user = msg.user;
			if( msg.password ) device.password = msg.password;

			var action = msg.action || node.action;
			var acap = msg.acap || node.acap;
			var filename = msg.filename || node.filename;

			msg.error = false;
			switch( action ) {
				case "ACAP Status":
					VapixWrapper.ACAP_List( device, function( error, list ) {
						msg.error = error;
						msg.payload = list;
						if(error) {
							node.send(msg);
							return;
						}
						if( acap ) {
							var selectedACAP = null;
							list.forEach( function( item ){
								if( item.Name === acap )
									selectedACAP = item;
							});
							if( selectedACAP ) {
								msg.payload = selectedACAP;
							} else {
								msg.error = acap + " is not installed";
								msg.payload = null;
								node.send(msg);
								return;
							}
						}
						node.send(msg);
					});
				break;

				case "Start ACAP":
					node.status({fill:"blue",shape:"dot",text:"Starting ACAP..."});
					if(!acap) {
						node.status({fill:"red",shape:"dot",text:"Starting ACAP failed"});
						msg.error = "ACAP ID not set";
						msg.payload = "Invalid ACAP ID";
						node.warn(msg.payload);
						node.send(msg);
						return;
					}
					VapixWrapper.ACAP_Control( device, "start", acap, function(error, response){
						msg.error = error;
						msg.payload = response;
						if( error )
							node.status({fill:"red",shape:"dot",text:"ACAP start failed"});
						else
							node.status({fill:"green",shape:"dot",text:"ACAP started"});
						node.send(msg);
					});
				break;

				case "Stop ACAP":
					node.status({fill:"blue",shape:"dot",text:"Stopping ACAP..."});
					if(!acap) {
						node.status({fill:"red",shape:"dot",text:"Stopping ACAP failed"});
						msg.error = "ACAP ID not set";
						msg.payload = "Invalid ACAP ID";
						node.warn(msg.payload);
						node.send(msg);
						return;
					}
					VapixWrapper.ACAP_Control( device, "stop", acap, function(error, response){
						msg.error = error;
						msg.payload = response;
						if( error )
							node.status({fill:"red",shape:"dot",text:"ACAP stop failed"});
						else
							node.status({fill:"green",shape:"dot",text:"ACAP stopped"});
						node.send(msg);
					});
				break;

				case "Remove ACAP":
					node.status({fill:"blue",shape:"dot",text:"Removing ACAP..."});
					if(!acap) {
						node.status({fill:"red",shape:"dot",text:"Removing ACAP failed"});
						msg.error = "ACAP ID not set";
						msg.payload = "Invalid ACAP ID";
						node.warn(msg.payload);
						node.send(msg);
						return;
					}
					VapixWrapper.ACAP_Control( device, "remove", acap, function(error, response){
						msg.error = error;
						msg.payload = response;
						if( error )
							node.status({fill:"red",shape:"dot",text:"Removing ACAP failed"});
						else
							node.status({fill:"green",shape:"dot",text:"ACAP removed"});
						node.send(msg);
					});
				break;

				case "Install ACAP":
					var data = filename || msg.payload;
					node.status({fill:"blue",shape:"dot",text:"Installing ACAP..."});
					VapixWrapper.Upload_ACAP( device, data, function(error, response){
						msg.acap = null;
						msg.error = error;
						msg.payload = response;
						if( error ) {
							node.status({fill:"red",shape:"dot",text:"ACAP installation failed"});
						} else {
							if( typeof response === "object" && response.hasOwnProperty("data") )
								msg.acap = response.data.id;
							node.status({fill:"green",shape:"dot",text:"ACAP installed"});
							msg.payload = "ACAP installed";
						}
						node.send(msg);
					});
				break;

				default:
					node.warn( action + "is not yet implemented");
				break;
			}
        });
    }

    RED.nodes.registerType("axis-acap", Axis_ACAP,{
		defaults: {
			action: { type:"name" },
			preset: {type:"axis-preset"},
			action: { type:"text" },
			acap: { type:"text" },
			filename: { type:"text" }
		}
	});
}
