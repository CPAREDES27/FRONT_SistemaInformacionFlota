sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter"
], function (BaseController, JSONModel,formatter) {
	"use strict";
	const HOST = 'https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com';

	return BaseController.extend("com.tasa.pcomptproduce.controller.App", {

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

			let oModel = this.getModel();
			oModel.setProperty("/searchForm", {
				empresaCod:undefined,
				empresaDesc:undefined
			});

			// Consumiendo servicios inciales
			this.countService = 3;
			this.count = 0;
			this.getDominiosService(oModel);
			this.getDataGrupoEmpresarial(oModel);
			this.getTemporadasService(oModel);
		},

		getDominiosService: async function(oModel){
			let oService = {},
			oDominiosData;

			oService.path = HOST+"/api/dominios/Listar";
			oService.param = {
				dominios:[
					{
						domname:"1ZONAAREA",
						status:"A"
					},
					{
						domname:"CATEGORIA",
						status:"A"
					}
				]
			};
			
			oDominiosData = await this.getDataService(oService);
			oDominiosData.data.forEach(oDom => {
				if(oDom.data.length>0){
					oModel.setProperty(`/${oDom.dominio}`,oDom["data"]);
				}else{
					this.getMessageDialog("Information",`No se econtraron registros en ${oDom.dominios} `);
				}
			});
		},
		getDataGrupoEmpresarial: async function(oModel){
			let oData,oService={};
			oService.path=HOST +"/api/General/AyudasBusqueda/";
			oService.param={
				nombreAyuda: "BSQEMPRESA",
				p_user: "FGARCIA"
			}
			oData = await this.getDataService(oService);
			if(oData){
				oModel.setProperty("/BSQEMPRESA",oData["data"]);
			}else{
				this.getMessageDialog("Information",`No se econtraron registros en empresas`);
			}
		},
		getDataEmpresaReceptora:function(oModel){
			let oService;
			oService.param={
				nombreAyuda: "",
				p_user: ""
			  }
		},

		getTemporadasService: async function(oModel){
			let oService = {},
			oTemporadaData;
			oService.path = HOST + "/api/General/Read_Table";
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
				let oLastTemp = aData[0],
				oHelp = {};
				oHelp.FHITM = oLastTemp["FHITM"],
				oHelp.FHFTM = oLastTemp["FHFTM"],
				oHelp.FHFTM = oLastTemp["FHFTM"],
				oHelp.CDPCN = oLastTemp["CDPCN"];
				oHelp.DSPCN = oLastTemp["DSPCN"];
				
				oModel.setProperty("/help",oHelp);
			}else{
				this.getMessageDialog("Information","No se econtraron registros de temporadas")
			}
		}
	});

});