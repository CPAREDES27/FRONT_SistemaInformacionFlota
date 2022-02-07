sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"../model/formatter"
], function (BaseController, JSONModel, History, Fragment, Filter, formatter) {
	"use strict";

	return BaseController.extend("com.tasa.pdeclaradadiaria.controller.Object", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit : function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var iOriginalBusyDelay,
				oViewModel = new JSONModel({
					busy : true,
					delay : 0
				});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			this.getOwnerComponent().getModel().dataLoaded().then(function () {
					// Restore original busy indicator delay for the object view
					oViewModel.setProperty("/delay", iOriginalBusyDelay);
				}
			);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */


		/**
		 * Event handler  for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */
		onNavBack : function() {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("worklist", {}, true);
			}
		},

		onRowsUpateTable:function(oEvent){
			let oTable = oEvent.getSource(),
			oRowBinding = oTable.getBinding(),
			oModel = this.getModel(),
			iVisibleRowCount = oModel.getProperty("/detailVisibleRowCount"),
			iLength = oRowBinding.iLength;
			if(iLength < iVisibleRowCount){
				oModel.setProperty("/detailVisibleRowCount",iLength);
			}
		},

		/**
		 * Filtro de icon tab bar
		 * @param {event} oEvent 
		 */
		 onFilterDiasSelect:function(oEvent){
			let sKey = oEvent.getParameter("key"),
			oObject = oEvent.getSource().getBindingContext().getObject();
			
			this._applyDiasBindTable(oObject,sKey)
		},

		/**
		 * eventos de Dialogo de Planta
		 * @param {event} oEvent 
		 */
		onPlantaDetail: async function(oEvent){
			let oView = this.getView(),
			oViewModel = this.getModel("objectView"),
			oContext = oEvent.getSource().getBindingContext(),
			oObject = oContext.getObject(),
			sPath = oContext.getPath();

			oViewModel.setProperty("/plantaSelectedKey","DP");
			oViewModel.setProperty("/plantPropTercKey","DPT");
			
			if(!this.oPlantaDialog){
				this.oPlantaDialog = await this.loadFragment({
					name:"com.tasa.pdeclaradadiaria.view.fragments.Planta"
				});
				// oView.addDependent(this.oPlantaDialog);
			};
			this.oPlantaDialog.bindElement(sPath);
			this._applyPlantaBindTable(oObject,"DP");
			this.oPlantaDialog.open();
		},

		onUpdateFinishedTable:function(oEvent){
			// if(oEvent.getParameter("reason")==="Filter") return;
			// let oContext = oEvent.getSource().getBindingContext(),
			// oModel = oContext.getModel(),
			// oViewModel = this.getModel("objectView"),
			// sPlantaSelectedKey = oViewModel.getProperty("/plantaSelectedKey"),
			// sPlantaIndPropKey = oViewModel.getProperty("/plantaIndPropKey"),
			// oObject = oContext.getObject(),
			// sCodPlanta = oObject["CDPTA"],
			// sIndProp,
			// sDate,sStartDate,sEndDate;

			// if(sPlantaSelectedKey === "DP"){ // dia
			// 	// sIndProp = "P";
			// 	sDate = oModel.getProperty("/date");
			// }else{ //rango
			// 	sDate = oModel.getProperty("/rangeDate");
			// 	sStartDate = sDate.split("-")[0].trim();
			// 	sEndDate = sDate.split("-")[1].trim();	
			// }
			
			// oModel.setProperty("/plantaIndPropKey", "DPT");

			// this._applyPlantaFilters(sCodPlanta)
		},

		/**
		 * Eventos filtro por Dia o Rango de fecha
		 * @param {*} oEvent 
		 */

		 onDateFilterSelect:function(oEvent){
			let sKey = oEvent.getParameter("key"),
			oContext = oEvent.getSource().getBindingContext(),
			oObject = oContext.getObject();
			this._applyPlantaBindTable(oObject,sKey);
		},


		/**
		 * Evento para filtro por indicador de propiedad
		 * @param {event} oEvent 
		 */
		onPlantaFilterSelect:function(oEvent){
			let oContext = oEvent.getSource().getBindingContext(),
			oObject = oContext.getObject(),
			sCodPlanta = oObject["CDPTA"];

			this._applyPlantaFilters(sCodPlanta);
		},

		/**
		 * Cerrar Dialogo de planta
		 * @param {event} oEvent 
		 */
		onCloseDialog:function(oEvent){
			let oDialog = oEvent.getSource().getParent();
			oDialog.close();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched : function (oEvent) {
			var sObjectId =  oEvent.getParameter("arguments").objectId;
			this._bindView("/STR_DL/" + sObjectId);
			
			// this.getModel().dataLoaded().then( function() {
			// 	// var sObjectPath = this.getModel().createKey("Products", {
			// 	// 	ProductID :  sObjectId
			// 	// });
				
			// }.bind(this));
		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView : function (sObjectPath) {
			this.getView().bindElement({
				path: sObjectPath,
				events:{
					change: this._onBindingChange.bind(this)
				}
			});
		},

		_onBindingChange:function(oEvent){
			let oElementBinding = oEvent.getSource(),
			oObject = oElementBinding.getBoundContext().getObject(),
			oViewModel = this.getModel("objectView");
			// No data for the binding
			if (!oObject) {
				oViewModel.setProperty("/busy", false);
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}
			let oModel = this.getModel(),
			aDiasData=oModel.getProperty("/pescaDetail/str_ptd"),
			aRangoData = oModel.getProperty("/pescaDetail/str_ptr"),
			sDate = oObject["FECCONMOV"],
			aDiaData = aDiasData.filter(dia => {
				if(dia.FIDES === sDate){
					dia = { ...oObject}
					return dia;
				}
			});

			aDiaData = this._calcularTotals(aDiaData);
			aRangoData = this._calcularTotals(aRangoData);
			oModel.setProperty("/dias",aDiaData);
			this._applyDiasBindTable(oObject,"D");
			oViewModel.setProperty("/selectedKey", "D");
			oViewModel.setProperty("/busy", false);
			oModel.setProperty("/detailVisibleRowCount",10);

		},

		/**
		 * Filtro para icon tab bar
		 * @param {object} oObject 
		 * @param {string} sKey 
		 */
		_applyDiasBindTable:function(oObject,sKey){
			let oTable = this.getView().byId("detailTableId"),
			// oLinktCol = this.getView().byId("linkTable"),
			oModel = this.getModel(),
			oViewModel = this.getModel("objectView"),
			sDate,sTitleTable, sBinding,that = this;
			
			if(sKey==="D"){
				oViewModel.setProperty("/statePlanta","Information");
				oViewModel.setProperty("/activePlanta",true);
				sTitleTable = "Día seleccionado";
				sBinding = "/dias";
				sDate = oObject["FECCONMOV"];
				// oLinktCol.setEnabled(true);
			}else{
				sDate = oModel.getProperty("/rangeDate");
				oViewModel.setProperty("/statePlanta","None");
				oViewModel.setProperty("/activePlanta",false);
				sBinding = "/pescaDetail/str_ptr";
				sTitleTable = "Rango de fechas";
				// oLinktCol.setEnabled(false);
			}
			oModel.setProperty("/dateType", sDate);
			oModel.setProperty("/titleTable", sTitleTable);
			oModel.setProperty("/detailVisibleRowCount",10)
			
			oTable.bindAggregation("rows",{path:sBinding});
		},

		_calcularTotals:function(aData){
			let aKeys = Object.keys(aData[0]),
			oRow = {},iTotal; 
			aKeys.forEach(key => {
				iTotal = aData.reduce( (acc , obj) => {
					if(!isNaN(obj[key])){
						return acc + obj[key]
					}
				},0);
				oRow[key] = iTotal;
			});
			oRow.WERKS = "Total";
			aData.push(oRow);
			aData.forEach(row => {
				row.PDLTO = row.PDLPR + row.PDLTR;
				row.PDSTO = row.PDSPR + row.PDSTR;
				// Dife total
				if( row.PDLTO > 0) {
					row.PORC_DIFER = ((row.PDLTO - row.PDSTO)*100)/row.PDLTO;
				}else{
					row.PORC_DIFER = 0;
				}

				// Dife propios
				if( row.PDLPR > 0) {
					row.PORC_DIFER_PR = ((row.PDLPR - row.PDSPR)*100)/row.PDLPR;
				}else{
					row.PORC_DIFER_PR = 0;
				}

				// Dife terceros
				if( row.PDLTR > 0) {
					row.PORC_DIFER_TR = ((row.PDLTR - row.PDSTR)*100)/row.PDLTR;
				}else{
					row.PORC_DIFER_TR = 0;
				}
			});
			return aData;
		},

		/**
		 * Metodos internos para Dialogo Planta, filtrar por planta
		 * @param {string} sCodPlanta 
		 */
		_applyPlantaFilters:function(sCodPlanta){
			let oTable = this.getView().byId("plantaTableId"),
			oBindingTable = oTable.getBinding("items"),
			oModel = this.getModel(),
			oViewModel = this.getModel("objectView"),
			sPlantaIndPropKey = oViewModel.getProperty("/plantaIndPropKey"),
			sPlantaSelectedKey = oViewModel.getProperty("/plantaSelectedKey"),
			aFilters = [],
			oFilter = {},
			sIndProp,
			sDate,sStartDate,sEndDate,
			itemCountProp = 0,
			itemCountTerc = 0;

			if(sPlantaSelectedKey === "DP"){
				sDate = oModel.getProperty("/date");
				if(sPlantaIndPropKey === "DPT"){
					sIndProp = "P"
				}else{
					sIndProp = "T"
				}
				oFilter = new Filter([
					new Filter("CDPTA","EQ",sCodPlanta),
					new Filter("INPRP","EQ",sIndProp),
					new Filter("FIDES","EQ",sDate)
				],true);
			}else{
				sDate = oModel.getProperty("/rangeDate");
				sStartDate = sDate.split("-")[0].trim();
				sEndDate = sDate.split("-")[1].trim();
				if(sPlantaIndPropKey === "DPT"){
					sIndProp = "P"
				}else{
					sIndProp = "T"
				}	
				oFilter = new Filter([
					// new Filter("CDPTA","EQ",sCodPlanta),
					new Filter("INPRP","EQ",sIndProp)
				],true);
			}
			aFilters.push(oFilter);
			if(oBindingTable){
				oBindingTable.filter(aFilters);
				if(sPlantaIndPropKey === "DPT"){
					itemCountProp = oBindingTable.iLength
					oModel.setProperty("/itemCountProp",itemCountProp);
				}else{
					itemCountTerc = oBindingTable.iLength
					oModel.setProperty("/itemCountTerc",itemCountTerc);
				}
				this._getTotales(oBindingTable.aIndices,oBindingTable.oList);
			}
		},

		/**
		 * Bindeo dinamico de tabla de plantas
		 * @param {*} oObject 
		 * @param {*} sKeyDateRange 
		 */
		_applyPlantaBindTable:function(oObject,sKeyDateRange){
			let oTable = this.getView().byId("plantaTableId"),
			oModel = this.getModel(),
			oViewModel = this.getModel("objectView"),
			oTemplate = this.getView().byId("templatePlantas"),
			sCodPlanta = oObject["CDPTA"],
			sDate,sTitleTable, sBinding;

			oTable.unbindAggregation("items");
			if(sKeyDateRange==="DP"){
				sDate = oObject["FIDES"];
				sTitleTable = "Día seleccionado";
				sBinding = "/pescaDetail/str_emd";
				oModel.setProperty("/date", sDate);
				
			}else if(sKeyDateRange==="RP"){
				sDate = oModel.getProperty("/rangeDate");
				sTitleTable = "Rango de fechas";
				sBinding = "/pescaDetail/str_emr";
			}
			
			oViewModel.setProperty("/plantaIndPropKey","DPT");
			oViewModel.setProperty("/plantaSelectedKey",sKeyDateRange)
			oModel.setProperty("/plantaTextTitle", sDate);
			oModel.setProperty("/plantaTableTitle", sTitleTable);

			oModel.setProperty("/itemCountProp",0);
			oModel.setProperty("/itemCountTerc",0);
			
			oTable.bindAggregation("items",{
				path:sBinding,
				template:oTemplate
			});

			this._applyPlantaFilters(sCodPlanta);
		},

		/**
		 * Totales para plantas
		 * @param {*} aIndices 
		 * @param {*} aData 
		 */
		_getTotales:function(aIndices,aData){
			let oModel = this.getModel(), 
			oItem,iTotCNPCM,iTotCNPDS,iTotPORC_DIFER,
			aSelectedData = [];
			aIndices.forEach(indice => {
				oItem = aData[indice];
				aSelectedData.push(oItem)
			});
			aSelectedData.forEach(item => {
				if(item.CNPCM > 0){
					item.PORC_DIFER = ((item.CNPCM - item.CNPDS)*100)/item.CNPCM
				}else{
					item.PORC_DIFER = "";
				}
			});
			iTotCNPCM =  aSelectedData.reduce((acc, obj) => { return acc + obj.CNPCM; }, 0);
			iTotCNPDS =  aSelectedData.reduce((acc, obj) => { return acc + obj.CNPDS; }, 0);
			if(iTotCNPCM > 0) {
				iTotPORC_DIFER = ((iTotCNPCM - iTotCNPDS)*100)/iTotCNPCM;
			}else{
				iTotPORC_DIFER = 0;
			}
			oModel.setProperty("/totCNPCM",iTotCNPCM);
			oModel.setProperty("/totCNPDS",iTotCNPDS);
			oModel.setProperty("/totPORC_DIFER",iTotPORC_DIFER)
		}

		// _itemsTable:function(){
		// 	let aCells = [];
		// 	return new sap.m.ColumnListItem({
		// 		cells:[
		// 			new sap.m.Text({text:"{NMEMB}"}),
		// 			new sap.m.Text({text:"{CPPMS}"}),
		// 			new sap.m.Text({text:"{CNPCM}"}),
		// 			new sap.m.Text({text:"{CNPDS}"}),
		// 			new sap.m.Text({text:"{}"}),
		// 		]
		// 	})
		// }

	});

});