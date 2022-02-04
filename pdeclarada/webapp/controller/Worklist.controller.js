sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/viz/ui5/format/ChartFormatter",
	"sap/viz/ui5/api/env/Format",
	"sap/ui/core/format/NumberFormat"
], function (
	BaseController, 
	JSONModel, 
	formatter, 
	Filter, 
	FilterOperator,
	ChartFormatter,
	Format,
	NumberFormat) {
	"use strict";

	return BaseController.extend("com.tasa.pdeclarada.controller.Worklist", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			var oViewModel,
				iOriginalBusyDelay,
				oTable = this.byId("tablePescaDeclarada");

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			// keeps the search state
			this._aTableSearchState = [];

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
				tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay: 0
			});
			this.setModel(oViewModel, "worklistView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});

			// formateo de grafico pie
			this._setFormatPieLabel();
			
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function (oEvent) {
			// update the worklist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function (oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},

		/**
		 * Event handler for navigating back.
		 * We navigate back in the browser history
		 * @public
		 */
		onNavBack: function () {
			// eslint-disable-next-line sap-no-history-manipulation
			history.go(-1);
		},


		onSearch: function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				var aTableSearchState = [];
				var sQuery = oEvent.getParameter("query");

				if (sQuery && sQuery.length > 0) {
					aTableSearchState = [new Filter("ProductID", FilterOperator.Contains, sQuery)];
				}
				this._applySearch(aTableSearchState);
			}

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function () {
			var oTable = this.byId("tablePescaDeclarada");
			oTable.getBinding("items").refresh();
		},

		onRowBindingChange:function(oEvent){
		},

		onBuscarPescaDescargada: async function () {
			let oModel = this.getModel(),
				oFormData = oModel.getProperty("/form"),
				oParam = {},
				oService= {},
				oMainTableData;

			this.Count = 0;
			this.CountService = 1;
			oParam.cdmma = oFormData.cdmma;
			oParam.fecon = formatter.formatDateInverse(oFormData.fecon);
			oService.url = `${this.getHostService()}/api/sistemainformacionflota/PescaDeclarada`;
			oService.param = this.getParametersService(oParam);
			oMainTableData = await this.getDataService(oService);
			if(oMainTableData){
				this.setDataStructure(oMainTableData);
			}
		},

		onCleanFilter: function () {
			let oModel = this.getModel(),
				oDate = new Date,
				oDateFormat = formatter.formatDateDDMMYYYY(oDate);
			oDate;
			oModel.setProperty("/form", {
				fecon: oDateFormat,
				cdmma: "A",
				hora: formatter.formatHours(oDate)
			})
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject: function (oItem) {
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getPath().split("/")[2]
			});
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_applySearch: function (aTableSearchState) {
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		},

		/**
		 * Internal helper method to formatter pie chart
		 */
		_setFormatPieLabel:function(){
			const chartFormatter = ChartFormatter.getInstance();
			Format.numericFormatter(chartFormatter);
			const UI5_FLOAT_FORMAT = "CustomFormatPie";
			const oPercentageFormat = NumberFormat.getPercentInstance({
				decimals:0,
				roundingMode:"FLOOR"
			}); 

			this.countChart = 0;
			this.bFlag = true;

			let that = this;

			chartFormatter.registerCustomFormatter(UI5_FLOAT_FORMAT, function(value) {
				// let oModel = this.getOwnerComponent().getModel(),
				let oModel = that.getModel(),
				aPieData = oModel.getProperty("/STR_TP_GRAPHICS"),
				item = aPieData[that.countChart],
				iCBOD;
				if(that.bFlag){
					that.bFlag = false;
					iCBOD = parseFloat(item.valuePorCBOD);
				}else{
					that.countChart ++;
					that.bFlag = true;
					if(item) iCBOD = parseFloat(item.valuePorCBOD)/100;
				}
				return `${oPercentageFormat.format(value)}(${oPercentageFormat.format(iCBOD)})`;
			
				// oItemData = aPieData.find(item => item.valuePorPesDe === value),
				// iCBOD = parseFloat(oItemData.valuePorCBOD);
				// console.log(oItemData.descripcion)
				// console.log(iCBOD)
				// console.log(value)
				// if(oItemData){

				// }
			});
		}
	});
});