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

		onUpdateFinishedTable:function(oEvent){
			if(oEvent.getParameter("reason")==="Filter") return;
			let oContext = oEvent.getSource().getBindingContext(),
			oModel = oContext.getModel(),
			oObject = oContext.getObject(),
			sCodPlanta = oObject["CDPTA"],
			sTipoPesca = "P";

			oModel.setProperty("/plantPropTercKey", "DPT")

			this._applyPlantaFilters(sCodPlanta,sTipoPesca)
		},

		onFilterSelect:function(oEvent){
			let sKey = oEvent.getParameter("key"),
			oObject = oEvent.getSource().getBindingContext().getObject();
			
			this._applyBindTable(oObject,sKey)
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
				this.oPlantaDialog = await Fragment.load({
					name:"com.tasa.pdeclaradadiaria.view.fragments.Planta",
					controller:this
				});
				oView.addDependent(this.oPlantaDialog);
			};
			this.oPlantaDialog.bindElement(sPath);
			this.oPlantaDialog.open();
			this._applyPlantaBindTable(oObject,"DP");
		},

		/**
		 * Eventos para Dialogo Planta
		 * @param {*} oEvent 
		 */

		 onDateFilterSelect:function(oEvent){
			let sKey = oEvent.getParameter("key"),
			oContext = oEvent.getSource().getBindingContext(),
			oObject = oContext.getObject();
			this._applyPlantaBindTable(oObject,sKey);
		},

		onPlantaFilterSelect:function(oEvent){
			let sKey = oEvent.getParameter("key"),
			oContext = oEvent.getSource().getBindingContext(),
			oModel = oContext.getModel(),
			oObject = oContext.getObject(),
			sCodPlanta = oObject["CDPTA"],
			sTipoPesca;

			if(sKey==="DPT"){
				sTipoPesca="P"
			}else{
				sTipoPesca = "T"
			}

			this._applyPlantaFilters(sCodPlanta,sTipoPesca);
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
			this.getModel().dataLoaded().then( function() {
				// var sObjectPath = this.getModel().createKey("Products", {
				// 	ProductID :  sObjectId
				// });
				this._bindView("/STR_DL/" + sObjectId);
			}.bind(this));
		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView : function (sObjectPath) {
			var oViewModel = this.getModel("objectView"),
			oDataModel = this.getModel(),
			oObject =  oDataModel.getProperty(sObjectPath);
			
			this.getView().bindElement({
				path: sObjectPath,
				events: {
					// change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oDataModel.dataLoaded().then(function () {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
			oViewModel.setProperty("/selectedKey", "D");
			oViewModel.setProperty("/busy", false);

			this._applyBindTable(oObject,"D");
			
		},

		_applyBindTable:function(oObject,sKey){
			let oTable = this.getView().byId("detailTableId"),
			oLinktCol = this.getView().byId("linkTable"),
			oModel = this.getModel(),
			sDate,sTitleTable, sBinding;
			if(sKey==="D"){
				sDate = oObject["FECCONMOV"];
				sTitleTable = "Día seleccionado";
				sBinding = "/pescaDetail/str_ptd";
				oLinktCol.setEnabled(true);
			}else{
				sDate = oModel.getProperty("/rangeDate");
				sTitleTable = "Rango de fechas";
				sBinding = "/pescaDetail/str_ptr";
				oLinktCol.setEnabled(false);
			}
			oModel.setProperty("/dateType", sDate);
			oModel.setProperty("/titleTable", sTitleTable);
			
			oTable.bindAggregation("rows",{path:sBinding})
		},

		/**
		 * Metodos internos para Dialogo Planta, filtrar por planta
		 * @param {string} sCodPlanta 
		 */
		_applyPlantaFilters:function(sCodPlanta,sTipoPesca){
			let oTable = sap.ui.getCore().byId("plantaTableId"),
			oBindingTable = oTable.getBinding("items"),
			aFilters = [],
			oFilter = {};

			oFilter = new Filter([new Filter("CDPTA","EQ",sCodPlanta),new Filter("INPRP","EQ",sTipoPesca)],true);
			aFilters.push(oFilter);
			oBindingTable.filter(aFilters);
		},

		_applyPlantaBindTable:function(oObject,sKeyDateRange){
			let oTable = sap.ui.getCore().byId("plantaTableId"),
			oModel = this.getModel(),
			oTemplate = this._itemsTable(),
			sDate,sTitleTable, sBinding;
			oTable.unbindAggregation("items");
			if(sKeyDateRange==="DP"){
				sDate = oObject["FIDES"];
				sTitleTable = "Día seleccionado";
				sBinding = "/pescaDetail/str_emd";
			}else if(sKeyDateRange==="RP"){
				sDate = oModel.getProperty("/rangeDate");
				sTitleTable = "Rango de fechas";
				sBinding = "/pescaDetail/str_emr";
			}
			oModel.setProperty("/plantaTextTitle", sDate);
			oModel.setProperty("/plantaTableTitle", sTitleTable);
			
			oTable.bindAggregation("items",{
				path:sBinding,
				template: oTemplate,
				templateShareable: false
			});
			
			// if(sKeyDateRange==="DP") this._applyPlantaFilters(sCodPlanta,sTipoPesca);
			// if(sKeyDateRange==="RP") this._applyPlantaFilters(null,sTipoPesca);
		},

		_itemsTable:function(){
			let aCells = [];
			return new sap.m.ColumnListItem({
				cells:[
					new sap.m.Text({text:"{NMEMB}"}),
					new sap.m.Text({text:"{CPPMS}"}),
					new sap.m.Text({text:"{CNPCM}"}),
					new sap.m.Text({text:"{CNPDS}"}),
					new sap.m.Text({text:"{}"}),
				]
			})
		}

	});

});