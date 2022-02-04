sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/BusyIndicator",
	"sap/base/Log",
	"../model/formatter",
], function (BaseController,
	JSONModel,
	BusyIndicator,
	Log,
	formatter) {
	"use strict";
	 const HOST = 'https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com';

	return BaseController.extend("com.tasa.pdeclarada.controller.App", {

		onInit: function () {
			var oViewModel,
				fnSetAppNotBusy,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				busy: true,
				delay: 0
			});
			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function () {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			// disable busy indication when the metadata is loaded and in case of errors
			this.getOwnerComponent().getModel().dataLoaded().
				then(fnSetAppNotBusy);
			this.getOwnerComponent().getModel().attachRequestFailed(fnSetAppNotBusy);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			// carga inicial
			this.Count = 0;
			this.CountService = 2;
			let oModel = this.getModel();
			// llamamos a servicios
			this.getDominios(oModel);
			// servicio para tabla principal
			this.getDataMainTable(oModel);

		},

		getDominios: async function(oModel){
			let oParam = {},
			oService = {};

			oParam.dominios = [
				{domname:"MOTIVOMAREA_RPDC",status:"A"}
			];
			oService.url = `${this.getHostService()}/api/dominios/Listar`;
			oService.param = oParam;
			let oDomData = await this.getDataService(oService),
			aData;
			if(oDomData){
				aData = oDomData.data[0].data;
				if(aData.length>0){
					oModel.setProperty(`/motivoMarea`,aData);
				}else{
					this.getMessageDialog("Information", "No se econtraron registros");
					oModel.setProperty(`/motivoMarea`,[]);
				}
			}
		},

		getDataMainTable: async function(oModel){
			let oDate = new Date,
			oParamObject = {},
			oService = {},
			oMainTableData,
			oParam;

			oParamObject.fecon = formatter.formatDateYYYYMMDD(oDate);
			oParamObject.cdmma = "A";
			oParamObject.hora = formatter.formatHours(oDate);
			oParam = this.getParametersService(oParamObject);
			oService.url = `${this.getHostService()}/api/sistemainformacionflota/PescaDeclarada`;
			oService.param = oParam;
			oMainTableData = await this.getDataService(oService);
			if(oMainTableData){
				this.setDataStructure(oMainTableData);
				// oModel.setProperty("/mainTable",oMainTableData);
				oParamObject.fecon = formatter.formatDateDDMMYYYY(oDate);
				oModel.setProperty("/form",oParamObject);
			}
		}
	});

});