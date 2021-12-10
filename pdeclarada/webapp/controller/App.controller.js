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
			this.count = 0;
			this.servicesLenght = 2;
			let oFormData = new Object,
			oDate = new Date;
			oFormData.fecon =formatter.formatDateDDMMYYYY(oDate);
			oFormData.cdmma = "A";
			oFormData.hora = formatter.formatHours(oDate);
			let oModel = this.getModel();
			oModel.setProperty("/form", oFormData)
			// llamamos a servicios
			this.getDominios(oModel);

			// servicio para tabla principal
			let oParam = new Object;
			oParam.fecon = formatter.formatDateYYYYMMDD(oDate);
			oParam.cdmma = oFormData.cdmma;
			this.getDataMainTable(oModel,oParam);
		},

		getDominios: async function(oModel){
			const sUrl = HOST + '/api/dominios/Listar',
			oParam = new Object;

			oParam.dominios = [
				{domname:"MOTIVOMAREA_RPDC",status:"A"}
			];
			let oDomData = await this.getDataService(sUrl, oParam),
			aData;
			if(oDomData){
				aData = oDomData.data[0].data;
				if(aData.length>0){
					oModel.setProperty(`/motivoMarea`,aData);
				}else{
					this.getMessageDialog("Information", "No se econtraron registros");
					oModel.setProperty(`/motivoMarea`,[]);
				}
				if(this.count===this.servicesLenght) BusyIndicator.hide();
			}
		}
	});

});