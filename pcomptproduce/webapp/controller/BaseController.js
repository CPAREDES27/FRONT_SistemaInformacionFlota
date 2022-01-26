sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/BusyIndicator",
	"sap/m/MessageBox",
	"sap/base/Log",
	"../model/formatter"
], function (
	Controller,
	UIComponent,
	BusyIndicator,
	MessageBox,
	Log,
	formatter) {
	"use strict";

	return Controller.extend("com.tasa.pcomptproduce.controller.BaseController", {
		formatter: formatter,

		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter : function () {
			return UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel : function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel : function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle : function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		Count:0,

		CountService:0,

		/**
		 * 
		 * @returns url of subaccount 
		 */
		 getHostSubaccount: function () {
            var urlIntance = window.location.origin,
            sUrlSubaccount,
            sParam; 

			if (urlIntance.indexOf('tasaqas') !== -1) {
                sUrlSubaccount = 'tasaqas'; // aputando a QAS
                sParam = "IDH4_QAS"
            } else if (urlIntance.indexOf('tasaprd') !== -1) {
                sUrlSubaccount = 'tasaprd'; // apuntando a PRD
                sParam = "IDH4_PRD"
            }else if(urlIntance.indexOf('localhost') !== -1){
				sUrlSubaccount = 'tasadev'; // apuntando a DEV
                sParam = "IDH4_DEV"
			}else{
				sUrlSubaccount = 'tasadev'; // apuntando a DEV
                sParam = "IDH4_DEV"
			}

            return {
                url : `https://${sUrlSubaccount}.launchpad.cfapps.us10.hana.ondemand.com`, 
                param : sParam
            };
        },

		/**
		 * 
		 * @returns url service 
		 */
		 getHostService: function () {
            var urlIntance = window.location.origin,
            servicioNode ; 

			if (urlIntance.indexOf('tasaqas') !== -1) {
                servicioNode = 'qas'; // aputando a QAS
            } else if (urlIntance.indexOf('tasaprd') !== -1) {
                servicioNode = 'prd'; // apuntando a PRD
            }else if(urlIntance.indexOf('localhost') !== -1){
				servicioNode = 'cheerful-bat-js'; // apuntando a DEV
			}else{
				servicioNode = 'cheerful-bat-js'; // apuntando a DEV
			}

            return `https://cf-nodejs-${servicioNode}.cfapps.us10.hana.ondemand.com`;
        },

		/**
		 * 
		 * @returns User loggued
		 */
		 getCurrentUser: async function(){
            let oUshell = sap.ushell,
            oUser={};
            if(oUshell){
                oUser = await sap.ushell.Container.getServiceAsync("UserInfo");
                let sEmail = oUser.getEmail().toUpperCase(),
                sName = sEmail.split("@")[0],
                sDominio= sEmail.split("@")[1];
                if(sDominio === "XTERNAL.BIZ") sName = "FGARCIA";
                oUser = {
                    name:sName
                }
            }else{
                oUser = {
                    name: "FGARCIA"
                };
            }
			return oUser
        },

		/**
         * Metodo para consultar servicios
         * @param {object} oService 
         * @returns 
         */
		 getDataService:async function(oService){
			try {
				BusyIndicator.show(0);
				this.Count++;
				let oFetch = await fetch(oService.url,{
					method:'POST',
					body:JSON.stringify(oService.param)
				});
				if(oFetch.status===200){
					if(this.Count === this.CountService) BusyIndicator.hide();
					return await oFetch.json();
				}else{
					BusyIndicator.hide();
					Log.error(`Status:${oFetch.status}, ${oFetch.statusText}`);
					return null;
				}
			} catch (error) {
				Log.error(`Error:${error}`);
				BusyIndicator.hide();
				this.setAlertMessage("error","Hubo un error de conexión con el servicio " + oService.serviceName);
			}
		},

		/**
         * Establece un mensaje de aviso para un evento determinado
         * @param {string} sType 
         * @param {string} sMessage 
         */
		 setAlertMessage:function(sType,sMessage){
            let sTitle = "Mensaje";
            if(sType === "success"){
                MessageBox.success(sMessage,{
                    title: sTitle
                });
            };
            if(sType === "information"){
                MessageBox.information(sMessage,{
                    title: sTitle
                });
            };
            if(sType === "warning"){
                MessageBox.warning(sMessage,{
                    title: sTitle
                });
            };
            if(sType === "error") {
                MessageBox.warning(sMessage,{
                    title: sTitle
                });
            };
        },

		/**
         * Retona objecto mensaje de confirmacion
         * @param {string} sMessage 
         * @returns oMessage
         */
		 getConfirmMessage:function(sMessage){
			// @ts-ignore
			let oDialogMessage = new sap.m.Dialog({
                type: sap.m.DialogType.Message,
                title: "Advertencia",
                state: "Warning",
                content: new sap.m.Text({ text: sMessage }),
                // @ts-ignore
                beginButton: new sap.m.Button({
                    type: "Emphasized",
                    text: "Aceptar",
                    icon: "sap-icon://accept",
                    press: function () {
                        oDialogMessage.close();
                    }.bind(this)
                }),
                // @ts-ignore
                endButton: new sap.m.Button({
                    type: "Reject",
                    text: "Cancelar",
                    icon: "sap-icon://decline",
                    press: function(){
                        oDialogMessage.close();
                    }.bind(this)
                })
            });

			return oDialogMessage;
		},

		_setPathIndPropiedad:function(sKey){
			let sPath1, sPath2;
			if(sKey === "D"){
				sPath1 = "CNPDS";
				sPath2 = "CNDSH";
			}else if(sKey === "P"){
				sPath1 = "CNDPR";
				sPath2 = "DSHPR";
			}else{
				sPath1 = "CPDTR";
				sPath2 = "DSHTR";
			}
			return {sPath1,sPath2}
		},

		/**
		 * Generar columnas dinamicas para zonas litorales
		 * @param {*} sLabel 
		 * @param {*} sCod 
		 * @param {*} sPathPesca 
		 * @param {*} sPathNdes 
		 * @returns 
		 */
		 getTableColumn:function(sLabel,sCod,sPathPesca,sPathNdes){
			let aLabels = ["Pesca","NDes","t/NDes"],
			aColumns = [],
			sHAlign,
			oText,
			sPath;

			aLabels.forEach(label=>{
				sHAlign = sap.ui.core.HorizontalAlign.End
				if(label === "NDes") sPath = sPathNdes;
				if(label === "Pesca") {
					sHAlign = sap.ui.core.HorizontalAlign.Center;
					sPath = sPathPesca;
				}
				if(label === "t/NDes"){
					oText =  new sap.m.Text({
						textAlign: sap.ui.core.TextAlign.End,
						text: {
							parts:[
								{path: `${sCod}/${sPathPesca}`},
								{path: `${sCod}/${sPathNdes}`}
							],
							formatter: function(sText1,sText2){
								return formatter.setDivision(sText1,sText2);
							}
						}
					});
				}else{
					oText =  new sap.m.Text({
						textAlign: sap.ui.core.TextAlign.End,
						text: {
							parts:[
								{path:`${sCod}/${sPath}`}
							],
							formatter: function(sText){
								return formatter.setFormatInteger(sText);
							}
						}
					});
				}
				oText.addStyleClass("colHeader");
				
				aColumns.push(new sap.ui.table.Column({
					width: "6rem",
					hAlign: sHAlign,
					headerSpan: label === "Pesca" ? "3,1" : "",
					multiLabels:[
						new sap.m.Label({
							text:sLabel
						}),
						new sap.m.Label({
							text:label
						})
					],
					template: oText
				}));
			});
			return aColumns;
		},

		getPuertosColumn:function(sLabel,sCodZona,sCodPuerto,sPath1,sPath2){
			let aLabels = [
				{label:"Pesca",sPath:sPath1},
				{label:"NDes",sPath:sPath2}
			],
			aColumns = [],
			sHAlign,
			oControl,
			that = this;

			aLabels.forEach(label=>{
				sHAlign = sap.ui.core.HorizontalAlign.End
				if(label.label === "Pesca") {
					sHAlign = sap.ui.core.HorizontalAlign.Center;
					oControl =  new sap.m.ObjectStatus({
						active:true,
						text: {
							path: `${sCodZona}/${sCodPuerto}/${label.sPath}`,
							formatter: function(sValue){
								return formatter.setFormatInteger(sValue);
							}
						},
						press:function(oEvent){
							this.onPressEmba(oEvent.getSource())
						}.bind(this)
					});
				}else{
					oControl =  new sap.m.Text({
						textAlign: sap.ui.core.TextAlign.End,
						text: {
							path: `${sCodZona}/${sCodPuerto}/${label.sPath}`,
							formatter: function(sValue){
								return formatter.setFormatInteger(sValue);
							}
						}
					});
				}
				
				oControl.addStyleClass("classPuerto");
				
				aColumns.push(new sap.ui.table.Column({
					width: "6rem",
					hAlign: sHAlign,
					headerSpan: label.label === "Pesca" ? "2,1" : "",
					multiLabels:[
						new sap.m.Label({
							text:sLabel
						}),
						new sap.m.Label({
							text:label.label
						})
					],
					template: oControl
				}));
			});
			return aColumns;
		},
	});

});