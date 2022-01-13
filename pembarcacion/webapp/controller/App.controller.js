sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter"
], function (BaseController, JSONModel, formatter) {
	"use strict";
	const HOST = 'https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com';

	return BaseController.extend("com.tasa.pembarcacion.controller.App", {

		onInit : function () {
			var oViewModel,
				fnSetAppNotBusy,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				busy : true,
				delay : 0
			});
			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function() {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			// disable busy indication when the metadata is loaded and in case of errors
			this.getOwnerComponent().getModel().dataLoaded().
				then(fnSetAppNotBusy);
			// this.getOwnerComponent().getModel().attachMetadataFailed(fnSetAppNotBusy);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			// Asignamos propiedad de datos de seleccion
			const oModel = this.getModel();
			oModel.setProperty("/formSearch", {
				startDate:"",
				endDate:"",
				tempDesc:"",
				fecha:""
			});
			this.iCount=0;
			this.iCountService=2;
			this.getDominiosService(oModel);
			this.getTemporadasService(oModel); 
		},

		getDominiosService: async function(oModel){
			let oService = {},
			oDominiosData;

			oService.PATH = HOST+"/api/dominios/Listar";
			oService.param = {
				dominios:[
					{
						domname:"TIPOEMBARCACION",
						status:"A"
					}
				]
			};
			
			oDominiosData = await this.getDataService(oService);
			if(oDominiosData.data[0].data.length>0){
				oModel.setProperty("/tipoEmbarcacion",oDominiosData["data"][0]["data"]);
			}else{
				this.getMessageDialog("Information","No se econtraron registros en tipo de embarcación");
			}
		},

		getTemporadasService: async function(oModel){
			let oService = {},
			oTemporadaData;
			oService.PATH = HOST + "/api/General/Read_Table";
			oService.param = {
				delimitador: "|",
				fields: ["CDPCN", "DSPCN", "FHITM", "FHFTM", "CTNAC", "ZCDZAR", "ZDSZAR"],
				no_data: "",
				option: [],
				options: [
					{
						cantidad: "",
						control: "MULTIINPUT",
						key: "ESPCN",
						valueHigh: "",
						valueLow: "S"
					}
				],
				order: "",
				p_user: "FGARCIA",
				rowcount: 0,
				rowskips: 0,
				tabla: "ZV_FLTZ"
			};

			oTemporadaData = await this.getDataService(oService);
			if(oTemporadaData.data.length>0){
				let aData = oTemporadaData["data"];
				aData.sort((a,b) => formatter.setFormatDate(b.FHITM) - formatter.setFormatDate(a.FHITM));
				let help = aData[0];
				help.tipoEmb = "001";
				oModel.setProperty("/help",help);
				// oModel.setProperty("/help/",help.ZCDZAR);
			}else{
				this.getMessageDialog("Information","No se econtraron registros de temporadas")
			}
		}
	});

});