sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter"
], function (BaseController, JSONModel, formatter) {
	"use strict";

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
			this.iCountService=3;
			this.getDominiosService(oModel);
			this.getTemporadasService(oModel); 
			this.getSearchingHelpId(oModel);
		},

		getDominiosService: async function(oModel){
			let oService = {},
			oDominiosData;

			oService.PATH = this.getHostService()+"/api/dominios/Listar";
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
			oUser = await this.getCurrentUser(),
			oTemporadaData;
			oService.PATH = this.getHostService() + "/api/General/Read_Table";
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
				p_user: oUser.name,
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
				oModel.setProperty("/user",oUser);
				// oModel.setProperty("/help/",help.ZCDZAR);
			}else{
				this.getMessageDialog("Information","No se econtraron registros de temporadas")
			}
		},

		getSearchingHelpId: async function(oModel){
			let oUser = await this.getCurrentUser(),
			sAyudaBusqUrl = this.getHostService() +"/api/General/ConsultaGeneral/",
			oAyudaBusqService = {                                         // parametros para Ayudas de Busqueda
                name : "Ayuda de Búsqueda",
                PATH : sAyudaBusqUrl,
                param : {
                    nombreConsulta: "CONSGENCONST",
                    p_user: oUser.name,
                    parametro1: this.getHostSubaccount().param,
                    parametro2: "",
                    parametro3: "",
                    parametro4: "",
                    parametro5: "",
                    parametro6: ""
                }
            },
			oAyudaBusqData = await this.getDataService(oAyudaBusqService);

			if(oAyudaBusqData){
                let aAyudaBusqData = oAyudaBusqData.data;
                if(aAyudaBusqData.length > 0){
                    oModel.setProperty("/ayudaBusqId",aAyudaBusqData[0].LOW);
					oModel.setProperty("/user",oUser);
					this.getSerachingHelpComponents(oModel,aAyudaBusqData[0].LOW);
                }else{
                    // this.setAlertMessage("information","No existen registros de la Ayuda de Búsqueda")
                }
            };

		},

		getSerachingHelpComponents:function(oModel,sAyudaBusqId){
			let sUrlSubaccount = this.getHostSubaccount().url,
			aSearchingHelp = ["busqtemporada"],
			oComponent,
			nameComponent,
			idComponent,
			urlComponent;
			
			aSearchingHelp.forEach(elem=>{
				oComponent = {};
				nameComponent = elem;
				idComponent = elem;
				urlComponent = `${sUrlSubaccount}/${sAyudaBusqId}.AyudasBusqueda.${elem}-1.0.0`;
				oComponent = new sap.ui.core.ComponentContainer({
					id:idComponent,
					name:nameComponent,
					url:urlComponent,
					settings:{},
					componentData:{},
					propagateModel:true,
					// componentCreated:comCreateOk,
					height:'100%',
					// manifest:true,
					async:false
				});
				oModel.setProperty(`/${elem}`,oComponent);
			});
		}
	});

});