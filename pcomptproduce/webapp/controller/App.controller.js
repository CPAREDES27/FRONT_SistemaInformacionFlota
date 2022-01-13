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
			oModel.setProperty("/help", {
				empresaCod:"",
				empresaDesc:""
			});

			// Consumiendo servicios inciales
			this.Count = 0;
			this.CountService = 5;
			this.getDominiosService(oModel);
			this.getDataEmpresaReceptora(oModel);
			this.getDataGrupoEmpresarial(oModel);
			this.getTemporadasService(oModel);
			this.getSearchingHelpId(oModel);
		},

		getDominiosService: async function(oModel){
			let oService = {},
			oDominiosData;

			oService.serviceName = "Dominios"
			oService.url = this.getHostService() + "/api/dominios/Listar";
			oService.param = {
				dominios:[
					{
						domname:"1ZONAAREA",
						status:"A"
					},
					{
						domname:"CATEGORIA",
						status:"A"
					},
					{
						domname:"ZINPRP",
						status:"A"
					}
				]
			};
			
			oDominiosData = await this.getDataService(oService);
			oDominiosData.data.forEach(oDom => {
				if(oDom.data.length>0){
					if(oDom.dominio === "ZINPRP"){
						oModel.setProperty(`/INPRP`,oDom["data"]);
					} else{
						oModel.setProperty(`/${oDom.dominio}`,oDom["data"]);
					}
				}else{
					this.setAlertMessage("information",`No se econtraron registros en ${oDom.dominio} `);
				}
			});
		},

		getDataEmpresaReceptora: async function(oModel){
			let oUser = await this.getCurrentUser(), 
			oData,oService={};

			oService.serviceName = "Empresas";
			oService.url= this.getHostService() +"/api/General/AyudasBusqueda/";
			oService.param={
				nombreAyuda: "BSQEMPRESAREC",
				p_user: oUser.name
			}
			oData = await this.getDataService(oService);
			if(oData){
				oModel.setProperty("/BSQEMPRESAREC",oData["data"]);
			}else{
				this.setAlertMessage("Information",`No se econtraron registros en empresas`);
			}
		},

		getDataGrupoEmpresarial: async function(oModel){
			let oUser = await this.getCurrentUser(), 
			oData,oService={};

			oService.serviceName = "Grupos empresariales";
			oService.url= this.getHostService() +"/api/General/AyudasBusqueda/";
			oService.param={
				nombreAyuda: "BSQGRPEMPR",
				p_user: oUser.name
			}
			oData = await this.getDataService(oService);
			if(oData){
				oModel.setProperty("/BSQGRPEMPR",oData["data"]);
			}else{
				this.setAlertMessage("Information",`No se econtraron registros en empresas`);
			}
		},

		getTemporadasService: async function(oModel){
			let oUser = await this.getCurrentUser(),
			oHelp = oModel.getProperty("/help") || {}, 
			oService = {},
			oTemporadaData;

			oService.serviceName = "Temporadas"
			oService.url = this.getHostService() + "/api/General/Read_Table";
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
				let oLastTemp = aData[0];

				oHelp.FHITM = oLastTemp["FHITM"],
				oHelp.FHFTM = oLastTemp["FHFTM"],
				oHelp.FHFTM = oLastTemp["FHFTM"],
				oHelp.CDPCN = oLastTemp["CDPCN"];
				oHelp.DSPCN = oLastTemp["DSPCN"];
				
				oModel.setProperty("/help",oHelp);
			}else{
				this.setAlertMessage("Information","No se econtraron registros de temporadas")
			}
		},

		getSearchingHelpId: async function(oModel){
			let oUser = await this.getCurrentUser(),
			sAyudaBusqUrl = this.getHostService() +"/api/General/ConsultaGeneral/",
			oAyudaBusqService = {                                         // parametros para Ayudas de Busqueda
                name : "Ayuda de Búsqueda",
                url : sAyudaBusqUrl,
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
                    this.setAlertMessage("information","No existen registros de la Ayuda de Búsqueda")
                }
            };

		},

		getSerachingHelpComponents:function(oModel,sAyudaBusqId){
			let sUrlSubaccount = this.getHostSubaccount().url,
			aSearchingHelp = ["busqtemporada","busqembarcaciones"],
			// iCountF = aSearchingHelp.length,
			// iCount = 0,
			oComponent,
			nameComponent,
			idComponent,
			urlComponent;
			
			// BusyIndicator.show(0);
			aSearchingHelp.forEach(elem=>{
				// let comCreateOk = function(oEvent){
				// 	if(iCountF === iCount) BusyIndicator.hide();
				// };
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
				oModel.setProperty(`/${elem}`,oComponent)
				// iCount++
			});
		}
	});

});