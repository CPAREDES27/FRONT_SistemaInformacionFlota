sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("com.tasa.pdeclaradadiaria.controller.Worklist", {

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
				oTable = this.byId("table");
				oVizFrameTnEp=this.byId("idVizFrameTnEp")

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			// keeps the search state
			this._aTableSearchState = [];

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
				shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
				shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
				shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
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

			let currentDate = new Date();
			let monthAgo = new Date();
			monthAgo.setMonth(monthAgo.getMonth() - 1);

			let oDateRangePescaDeclaradaDiaria = this.byId("dateRangePescaDeclaradaDiaria");
			oDateRangePescaDeclaradaDiaria.setDateValue(monthAgo);
			oDateRangePescaDeclaradaDiaria.setSecondDateValue(currentDate);

			this.getDataTable(monthAgo, currentDate);
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
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
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
				objectId: oItem.getBindingContext().getProperty("ProductID")
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
		buscarPescaDescargadaDiaria: function () {
			const fechaInicio = this.byId("dateRangePescaDeclaradaDiaria").getDateValue();
			const fechaFin = this.byId("dateRangePescaDeclaradaDiaria").getSecondDateValue();

			this.getDataTable(fechaInicio, fechaFin);
		},
		calcularTotales: function () {
			let listPescaDeclaradaDiaria = this.getModel().getProperty("/STR_DL");

			/**
			 * Copia del primer elemento para obtener su modelo
			 */
			let pescaDeclaradaDiara = { ...listPescaDeclaradaDiaria[0] };


		},
		getDataTable: async function (fechaInicio, fechaFin) {
			let listPescaDeclaradaDiaria = await this.getListPescaDeclaradaDiaria(fechaInicio, fechaFin);
			if (listPescaDeclaradaDiaria) {
				this.getModel().setProperty("/STR_DL", listPescaDeclaradaDiaria.str_dl);
				let str_dlTotales = listPescaDeclaradaDiaria.str_dl[listPescaDeclaradaDiaria.str_dl.length - 1];

				//Reporte de % totales de pesca declarada propios y terceros
				this.getModel().setProperty("/PORC_PESC_DECL",
					[
						{
							descripcion: 'Propios',
							value: str_dlTotales.PORC_DECL_CHI_PROP
						}, {
							descripcion: 'Terceros',
							value: str_dlTotales.PORC_DECL_CHI_TERC
						}
					]);

				//Reportes de TN/EP propios y terceros
				let st_dlGraphics = JSON.parse(JSON.stringify(listPescaDeclaradaDiaria.str_dl))
				st_dlGraphics.pop();
				let pesca = [{
					desc: '',
					lines: [{
						points: [{
							min: 243,
							max: 428
						}]
					}, {
						points: [{
							min: 122,
							max: 143
						}]
					}]
				}]
				this.getModel().setProperty("/PESCA_TN_EP", pesca);

				const reportPTnEp = st_dlGraphics.map(s => {
					return {
						fecha: s.FECCONMOV,
						prop: s.EFIC_PROP,
						terc: s.EFIC_TERC
					};
				});
				this.getModel().setProperty("/TN_EP", reportPTnEp);
			}
		}
	});
});