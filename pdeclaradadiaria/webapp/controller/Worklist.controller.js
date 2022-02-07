sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/BusyIndicator"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator,BusyIndicator) {
	"use strict";
	var HOST = 'https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com';

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
			let oViewModel,
			iOriginalBusyDelay,
			oModel = this.getModel(),
			oTable = this.byId("table");
				// oVizFrameTnEp=this.byId("idVizFrameTnEp")

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
			// oTable.attachRowsUpdated("updateFinished", function () {
			// 	// Restore original busy indicator delay for worklist's table
			// 	oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			// });
		},

		/**
		 * @override
		 */
		onAfterRendering: function() {
			// Carga inicial
			let oParam = new Object,
			oModel = this.getModel(),
			currentDate = new Date(),
			monthAgo = new Date(),
			sStartDate,
			sEndDate,
			sRangeDate;

			monthAgo.setMonth(monthAgo.getMonth() - 1);
			sStartDate = formatter.formatDateDDMMYYYY(monthAgo);
			sEndDate = formatter.formatDateDDMMYYYY(currentDate);
			sRangeDate = `${sStartDate} - ${sEndDate}`;
			oModel.setProperty("/rangeDate", sRangeDate);

			oParam.sEndDate = formatter.formatDateYYYYMMDD(currentDate);
			oParam.sStartDate = formatter.formatDateYYYYMMDD(monthAgo);

			// variable global para configuracion de totales
			this.iLastStartIndex=0;

			this.Count = 0;
			this.CountService = 1;

			this._getDataMainTable(oModel,oParam);
		
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

		onRowsUpateTable:function(oEvent){
			let oTable = this.getView().byId(oEvent.getParameter("id")),
			oRowBinding = oTable.getBinding("rows"),
			iLastStartIndex = oRowBinding.iLastStartIndex;
			if(iLastStartIndex>0){
				if(this.iLastStartIndex===iLastStartIndex) return;
				this.iLastStartIndex=iLastStartIndex;
				let aDataRowsTot = oRowBinding.oList,
				aDataRows = aDataRowsTot.slice(0,iLastStartIndex),
				aRows = oTable.getRows(),
				iFixedRowCount = oTable.getVisibleRowCount(),
				oRowLast = aRows[iFixedRowCount-1];
				this._formatRowLast(oRowLast,aDataRows);
				this._setDataGraphics(oRowLast,aDataRows);
			}
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

		onClearFilters:function(){
			let oModel = this.getModel();
			oModel.setProperty("/rangeDate","");
			oModel.setProperty("/STR_DL",[]);
			oModel.setProperty("/dataViz",[]);
			oModel.setProperty("/dataGraficPorc",[]);
			oModel.setProperty("/visibleRowCount",10);
		},

		/**
		 * Metodo para cargar tabla principal
		 * @param {event} oEvent 
		 */
		onSearchPesca: function (oEvent) {
			let oModel = this.getModel(),
			sRangeDate = oModel.getProperty("/rangeDate"),
			sStartDate = sRangeDate.split("-")[0].trim(),
			sEndDate = sRangeDate.split("-")[1].trim(),
			oParam = {};
			
			sStartDate = formatter.formatDateInverse2(sStartDate);
			sEndDate = formatter.formatDateInverse2(sEndDate);
			oParam.sStartDate = sStartDate;
			oParam.sEndDate = sEndDate;

			// const fechaInicio = this.byId("dateRangePescaDeclaradaDiaria").getDateValue();
			// const fechaFin = this.byId("dateRangePescaDeclaradaDiaria").getSecondDateValue();

			this._getDataMainTable(oModel, oParam);
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
			let oObject = oItem.getBindingContext().getObject(),
			sDate = oObject["FECCONMOV"];
			
			this._getDetailData(sDate,oItem);
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
		_getDataMainTable: async function(oModel,oParam){
			this.Count = 0;
			this.CountService = 1;

			let sUrl = this.getHostService() + '/api/sistemainformacionflota/PescaDeclaradaDiara',
			param = {
				fieldstr_dl : [],
				p_fefin : oParam.sEndDate,
				p_feini : oParam.sStartDate,
				p_user : ""
			},
			oService = {
				url: sUrl,
				param: param
			},
			oPescaData = await this.getDataService(oService),
			aData;
			if(oPescaData){
				aData = oPescaData["str_dl"];
				aData = this._calcularTotales(aData);
				if(aData.length>0){
					let iDataLength = aData.length;
					oModel.setProperty("/visibleRowCount",iDataLength);
					oModel.setProperty(`/STR_DL`,aData);
					
				}else{
					this.getMessageDialog("Information", "No se econtraron registros para la busqueda");
					oModel.setProperty(`/STR_DL`,[]);
				}
				BusyIndicator.hide();
			}
			
		},

		_calcularTotales:function(aData){
			let oRowLast = aData[aData.length - 1];
			if(!oRowLast.FECCONMOV){
				oRowLast.FECCONMOV = "Total";
				if(oRowLast.PESC_DECL_CHI > 0){
					// % Pesca propios
					oRowLast.PORC_DECL_CHI_PROP = (oRowLast.PPCHI/oRowLast.PESC_DECL_CHI)*100;
					// % Pesca Terceros
					oRowLast.PORC_DECL_CHI_TERC = (oRowLast.PTCHI/oRowLast.PESC_DECL_CHI)*100;
					// Dif
					oRowLast.PORC_DIFER = (oRowLast.PESC_DECL_CHI - oRowLast.PESC_DESC_CHI)*100/oRowLast.PESC_DECL_CHI; 
				}else{
					oRowLast.PORC_DECL_CHI_PROP = 0;
					oRowLast.PORC_DECL_CHI_TERC = 0;
					oRowLast.PORC_DIFER = 0;
				}

				let iCountHar = 0;
				aData.forEach(oRow => {
					if(oRow["PESC_DECL_CHI"]>0) iCountHar++;
				});
				iCountHar--;

				// Tn/Ep Propio
				let sValTnEpProp = 0;
				aData.forEach(oRow => {
					if(oRow["EFIC_PROP"]>0 && oRow["EFIC_PROP"]<1000000) sValTnEpProp += oRow["EFIC_PROP"];
				});
				oRowLast.EFIC_PROP = sValTnEpProp/iCountHar;

				// Tn/Ep Tercero
				let sValTnEpTerc = 0;
				aData.forEach(oRow=>{
					if(oRow["EFIC_TERC"]>0 && oRow["EFIC_TERC"]<1000000) sValTnEpTerc += oRow["EFIC_TERC"];
				});
				oRowLast.EFIC_TERC =  sValTnEpTerc/iCountHar;

				// Ep Propio
				let sValEpProp = 0;
				aData.forEach((row)=>{
					if(row.EFIC_PROP > 0) 
						sValEpProp += row.PESC_DECL_CHI;
				});
				oRowLast.CNEMP = sValEpProp/sValTnEpProp
				// oRowLast.CNEMP = sValEpProp/iCountHar;
				// oEpProp.setText(Math.trunc(sTotalValEpProp));

				// Ep Tercero
				let sValEpTerc = 0;
				aData.forEach(row=>{
					// if(row.CNEMT > 0) 
					sValEpTerc += row.PESC_DECL_CHI;
				});
				oRowLast.CNEMT = sValEpTerc/sValTnEpTerc;
				// oEpTerc.setText(Math.trunc(sTotalValEpTerc));
				
			}
			return aData;
		},

		_formatRowLast:function(oRowLast){
			let oControl = oRowLast.getCells()[0];
			oControl.setActive(false);
			oControl.setState("Error");
		},
		
		_setDataGraphics:function(oRowLast,aDataRows){
			let oModel = this.getModel(),
			aDataViz = [],
			aCells = oRowLast.getCells(),
			oPropCell = aCells[4],
			oTercCell = aCells[6],
			iValueProp = parseInt(oPropCell.getText()),
			iValueTerc = parseInt(oTercCell.getText()),
			aGraphData=[
				{
					descripcion:"Propios",
					propios:iValueProp,
					terceros:iValueTerc
				}
			],
			fecha;

			aDataRows.forEach(oRow=>{ 
				fecha = formatter.formatDateYYYYMMDDstr(oRow.FECCONMOV);
				aDataViz.push({
					fecha,
					propio:oRow.EFIC_PROP > 1000000 ? 0 : oRow.EFIC_PROP,
					tercero:oRow.EFIC_TERC > 1000000 ? 0 : oRow.EFIC_TERC
				})
			});
			oModel.setProperty("/dataGraficPorc", aGraphData);
			oModel.setProperty("/dataViz", aDataViz);
		},
		
		_getDetailData: async function(sDate,oItem){
			this.Count = 0;
			this.CountService = 1;
			let sUrl = this.getHostService()+"/api/sistemainformacionflota/PescaDeclaradaDife",
			oModel = this.getModel(),
			sDateParam = formatter.formatDateInverse2(sDate),
			sRangeDate = oModel.getProperty("/rangeDate"),
			sStartDate = sRangeDate.split("-")[0].trim(),
			sEndDate = sRangeDate.split("-")[1].trim(),
			sStartDateParam = formatter.formatDateInverse(sStartDate),
			sEndDateParam = formatter.formatDateInverse(sEndDate),
			oUser = oModel.getProperty("/user"),
			param = {
				fieldstr_emd: [],
				fieldstr_emr: [],
				fieldstr_ptd: [],
				fieldstr_ptr: [],
				p_fecha: sDateParam,
				p_ffdes: sEndDateParam,
				p_fides: sStartDateParam,
				p_user: oUser.name
			},
			oService = {
				url: sUrl,
				param: param
			},

			oPescaDetail = await this.getDataService(oService);
			
			if(oPescaDetail){
				oModel.setProperty("/pescaDetail", oPescaDetail);
				this.getRouter().navTo("object", {
					objectId: oItem.getBindingContext().getPath().split("/")[2]
				});
			}
		}
	});
});