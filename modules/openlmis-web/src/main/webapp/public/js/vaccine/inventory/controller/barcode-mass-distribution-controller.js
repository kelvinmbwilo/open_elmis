/*
 * Electronic Logistics Management Information System (eLMIS) is a supply chain management system for health commodities in a developing country setting.
 *
 * Copyright (C) 2015 Clinton Health Access Initiative (CHAI). This program was produced for the U.S. Agency for International Development (USAID). It was prepared under the USAID | DELIVER PROJECT, Task Order 4.
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


function BarcodeMassDistributionController($scope,$http,$location, $document,$window,configurations,$timeout,homeFacility,OneLevelSupervisedFacilities,FacilityWithProducts,StockCardsByCategory,StockEvent,SaveDistribution,localStorageService,$anchorScroll) {

    $scope.userPrograms=configurations.programs;
    $scope.period=configurations.period;
    $scope.homeFacility=homeFacility;
    $scope.facilityDisplayName=homeFacility.name;
    $scope.toIssue=[];
    $scope.distributionType='ROUTINE';
    $scope.UnScheduledFacility=undefined;
    $scope.maxModalBodyHeight='max-height:'+parseInt($document.height() * 0.46,10)+'px !important';
    $scope.data = {};
    $scope.data.allowMultipleScan = true;
    $scope.data.showReport = false;
    $scope.loadSupervisedFacilities=function(programId){
        OneLevelSupervisedFacilities.get({programId:programId},function(data){
            $scope.supervisedFacilities=data.facilities;
        });
    };

    $scope.loadFacilityDistributionData=function(){
        $scope.routineFacility=undefined;
        $scope.message=false;
        if($scope.selectedRoutineFacility !== null)
            FacilityWithProducts.get($scope.selectedProgram,$scope.selectedRoutineFacility,$scope.homeFacility.id).then(function(data){
                $scope.routineFacility=data;
            });
    };

    $scope.closeModal=function(){
        $scope.currentProduct.lots=$scope.oldProductLots;
        evaluateTotal($scope.currentProduct);
        evaluateSOH($scope.currentProduct);
        $scope.currentFacility=undefined;
        $scope.lotsModal=false;
    };
    $scope.saveCurrent=function(){
        evaluateTotal($scope.currentProduct);
        evaluateSOH($scope.currentProduct);
        $scope.currentFacility=undefined;
        $scope.lotsModal=false;
    };

    //update the total doses for the product and the boxes and vials for a updated value
    $scope.updateCurrentTotal=function(product,lot){
        var totalCurrentLots = 0;
        if(product.lots !== undefined)
        {
            $(product.lots).each(function (index, lotObject) {
                if(lotObject.quantity !== undefined && lotObject.quantity !== null){
                    totalCurrentLots = totalCurrentLots + parseInt(lotObject.quantity,10);
                }
            });
            product.quantity=totalCurrentLots;
        }
        else{
            product.quantity=product.quantity;
        }

        //update boxes and vials as doses change
        if(lot){
            if(product.packaging){
                var vials_per_box = product.packaging.vialsperbox;
                var doses_per_vials = product.packaging.dosespervial;
                var dosesInBox = vials_per_box*doses_per_vials;
                lot.boxes = parseInt(lot.quantity / dosesInBox);
                lot.vials = lot.quantity % dosesInBox;
            }
        }else{

        }

    };

    //update the number of doses when there is a change in boxes and lose vials
    $scope.updateCurrentTotal1  = function(product,lot){
        var vials_per_box = product.packaging.vialsperbox;
        var doses_per_vials = product.packaging.dosespervial;
        if(lot){
            var boxes = (lot.boxes === '')?0:lot.boxes;
            var vials = (lot.vials === '')?0:lot.vials;
            var num = 0;
            if(boxes != 0){
                num += boxes*vials_per_box*doses_per_vials;
            }if(vials != 0){
                if(vials >= vials_per_box){
                    lot.boxes = lot.boxes + Math.floor(vials / vials_per_box)
                    vials = vials % vials_per_box;
                    lot.vials = vials % vials_per_box;
                }
                num += doses_per_vials*vials;
            }
            lot.quantity = num;
            var totalCurrentLots = 0;
            if(product.lots !== undefined)
            {
                $(product.lots).each(function (index, lotObject) {
                    if(lotObject.quantity !== undefined && lotObject.quantity !== null){
                        totalCurrentLots = totalCurrentLots + parseInt(lotObject.quantity,10);
                    }
                });
                product.quantity=totalCurrentLots;
            }
            else{
                product.quantity=product.quantity;
            }
        }else{
            var boxes = (product.boxes === '')?0:product.boxes;
            var vials = (product.vials === '')?0:product.vials;
            var num = 0;
            if(boxes != 0){
                num += boxes*vials_per_box*doses_per_vials;
            }if(vials != 0){
                num += doses_per_vials*vials;
            }
            product.quantity = num;
        }


    };

    $scope.updateCurrentPOD=function(product){
        var totalCurrentLots = 0;
        product.lots.forEach(function (lot) {
            if(lot.quantity !== undefined){
                totalCurrentLots = totalCurrentLots + parseInt(lot.quantity,10);
            }
        });
        product.quantity=totalCurrentLots;
    };
    function evaluateTotal(product){
        var totalLots = 0;
        if(product.lots !== undefined)
        {
            $(product.lots).each(function (index, lotObject) {
                if(lotObject.quantity !== undefined){
                    totalLots = totalLots + parseInt(lotObject.quantity,10);
                }

            });
            $scope.currentProduct.quantity=totalLots;
        }
        else{
            //$scope.currentProduct.quantity=totalLots;
        }

    }
    function getLotSum(_product,_lot){
        var total=0;
        ($scope.allScheduledFacilities).forEach(function(facility){
            var product=_.find(facility.productsToIssue,function(p){
                return p.productId ===_product.productId;
            });
            if(product.lots !== undefined){
                var lot=_.find(product.lots,function(l){
                    return l.lotId === _lot.lotId;
                });
                if(lot && lot.quantity !==undefined)
                {
                    total=total+parseInt(lot.quantity,10);
                }
            }
            else{
                if(product.quantity !== undefined){
                    total=total+parseInt(product.quantity,10);
                }

            }

        });
        return total;
    }
    function evaluateSOH(_product)
    {
        ($scope.allScheduledFacilities).forEach(function(facility){
            facility.productsToIssue.forEach(function(product){
                if(product.lots !== undefined)
                {
                    product.lots.forEach(function(lot){
                        lot.quantityOnHand=lot.quantityOnHand2-getLotSum(product,lot);
                    });
                }
                else{
                    product.totalQuantityOnHand=product.totalQuantityOnHand2-getLotSum(product,undefined);
                }

            });

        });
    }
    if($scope.userPrograms.length > 1)
    {
        $scope.showPrograms=true;
        //TODO: load stock cards on program change
        $scope.selectedProgram=$scope.userPrograms[0];
        $scope.loadSupervisedFacilities($scope.userPrograms[0]);
    }
    else if($scope.userPrograms.length === 1){
        $scope.showPrograms=false;
        $scope.selectedProgram=$scope.userPrograms[0];
        $scope.loadSupervisedFacilities($scope.userPrograms[0].id);
    }

    //pull all gtin information
    $http.get('/vaccine/gitn_lookup/all').success(function(data) {
        $scope.gtin_lookups = data.gitn_lookup;
    }).
    error(function(data) {
        console.log("Error:" + data);
    });

    $scope.data.loading_item = false;

    //react to scanning of lot number
    $scope.scanLotNumber = function(barcodeString){
        if(barcodeString !== ""){
            $scope.barcode ={};
            $scope.barcode.lot_number = "";
            $scope.barcode.gtin = "";
            $scope.barcode.expiry = "";
            //check for the GS1 character
            if(barcodeString.substring(0,3) === "]d2"){
                if(barcodeString.length > 45){
                    var n = barcodeString.lastIndexOf("21");
                    $scope.barcode.expiry = barcodeString.substring(21,27);
                    $scope.barcode.gtin = barcodeString.substring(5,19);
                    $scope.barcode.lot_number = barcodeString.substring(29,n);
                }else if(barcodeString.length >= 29){
                    $scope.barcode.lot_number = barcodeString.substring(29);
                    $scope.barcode.expiry = barcodeString.substring(21,27);
                    $scope.barcode.gtin = barcodeString.substring(5,19);
                }else{
                    $scope.data.error_loading_gtin = true;
                    $scope.data.error_loading_item = false;
                    $scope.data.loading_item = false;
                }
            }else if(barcodeString.substring(0,2) === "01"){
                if(barcodeString.length > 45){
                    var n = barcodeString.lastIndexOf("21");
                    $scope.barcode.expiry = barcodeString.substring(18,24);
                    $scope.barcode.gtin = barcodeString.substring(2,16);
                    $scope.barcode.lot_number = barcodeString.substring(26,n);
                }else if(barcodeString.length >= 29){
                    $scope.barcode.lot_number = barcodeString.substring(26);
                    $scope.barcode.expiry = barcodeString.substring(18,24);
                    $scope.barcode.gtin = barcodeString.substring(2,16);
                }else{
                    $scope.data.error_loading_gtin = true;
                    $scope.data.error_loading_item = false;
                    $scope.data.loading_item = false;
                }

            }else{
                $scope.data.error_loading_gtin = true;
                $scope.data.error_loading_item = false;
                $scope.data.loading_item = false;
            }

            $scope.data.loading_item = true;
            $scope.barcode.formatedDate = $scope.formatDate(new Date("20"+$scope.barcode.expiry.replace(/(.{2})/g,"$1-").slice(0, -1)));

            $scope.current_item = $scope.getItemByGTIN($scope.barcode , $scope.productsInList);
            if($scope.current_item.gtinInformation === false){
                $scope.data.error_loading_gtin = true;
                $scope.data.error_loading_item = false;
                $scope.data.loading_item = false;
            }else{
                $scope.data.error_loading_gtin = false;
                $scope.data.error_loading_item = false;
                $scope.data.loading_item = true;
                if($scope.current_item.available === false){
                    $scope.data.error_loading_item = true;
                    $scope.data.loading_item = false;
                }else{

                    $scope.data.error_loading_item = false;
                    $scope.data.loading_item = false;
                    $scope.data.show_singleItem = true;
                    $scope.data.process_package = false;
                }
            }


        }else{
            $scope.data.error_loading_gtin = false;
            $scope.data.error_loading_item = false;
            $scope.data.loading_item = false;
        }


    };

    //producing pdf for issuing report
    $scope.produceIssuingPDF = function(){
        html2canvas(document.getElementById('exportthis'), {
            onrendered: function (canvas) {
                var data = canvas.toDataURL();
                var docDefinition = {
                    content: [{
                        image: data,
                        width: 1100,
                    }]
                };
                pdfMake.createPdf(docDefinition).download("Score_Details.pdf");
            }
        });
    };

    //close pdf view
    $scope.cancelPDF = function(){
      $scope.data.showReport = false;
    };

    //finding an item from the gtin Lookup table
    $scope.getItemByGTIN = function(barcode_object,listItems){
        var item = {available:false,gtinInformation:false};
        angular.forEach($scope.gtin_lookups,function(packagingInformation){
            if(barcode_object.gtin == packagingInformation.gtin){
                item.gtinInformation = true;
                angular.forEach(listItems,function(product){
                    if(packagingInformation.productid == product.productId){
                        //append packaging information
                        product.packaging = packagingInformation;

                        //construct a lot
                        var lots = angular.copy(product.lots);
                        angular.forEach(lots,function(productLot){
                            if(productLot.lotCode == barcode_object.lot_number && barcode_object.formatedDate == productLot.expirationDate){
                                item.available = true;
                                //adding products to list of items to be displayed
                                if(!$scope.facilityToIssue.productsToIssueByCategory[$scope.vaccineIndex].productCategory) {
                                    $scope.facilityToIssue.productsToIssueByCategory[$scope.vaccineIndex].productCategory = "Vaccine";
                                    $scope.facilityToIssue.productsToIssueByCategory[$scope.vaccineIndex].productsToIssue = [];
                                }
                                if($scope.checkProductInList($scope.facilityToIssue.productsToIssueByCategory[$scope.vaccineIndex].productsToIssue,product.productId)){
                                    angular.forEach($scope.facilityToIssue.productsToIssueByCategory[$scope.vaccineIndex].productsToIssue, function(item){
                                        if(item.productId == packagingInformation.productid){
                                            if($scope.checkLOtInList(item.lots,barcode_object.lot_number)){
                                                angular.forEach(item.lots,function(singleLot){
                                                    if(singleLot.lotCode == barcode_object.lot_number){
                                                        if($scope.data.allowMultipleScan){
                                                            singleLot.boxes++;
                                                            $scope.updateCurrentTotal1(item,singleLot);
                                                        }
                                                    }

                                                });
                                            }else{
                                                if($scope.data.allowMultipleScan){
                                                    productLot.boxes = 1;
                                                    productLot.vials = 0;
                                                    item.lots.push(productLot);
                                                    var indexToUse = item.lots.length -1;
                                                    $scope.updateCurrentTotal1(item,item.lots[indexToUse]);
                                                }else{
                                                    productLot.boxes = 0;
                                                    productLot.vials = 0;
                                                    item.lots.push(productLot);
                                                }

                                            }
                                        }
                                    });
                                    //if it is a new item completely.
                                }else{
                                    var productToPush = angular.copy(product);
                                    productToPush.lots = [];
                                    if($scope.data.allowMultipleScan){
                                        productToPush.boxes = 1;
                                        productToPush.vials = 0;
                                        productLot.boxes = 1;
                                        productLot.vials = 0;
                                        productToPush.lots.push(productLot);
                                        $scope.updateCurrentTotal1(productToPush,productLot);
                                        $scope.facilityToIssue.productsToIssueByCategory[$scope.vaccineIndex].productsToIssue.push(productToPush);
                                    }else{
                                        productToPush.boxes = 0;
                                        productToPush.vials = 0;
                                        productLot.boxes = 0;
                                        productLot.vials = 0;
                                        productToPush.lots.push(productLot);
                                        $scope.facilityToIssue.productsToIssueByCategory[$scope.vaccineIndex].productsToIssue.push(productToPush);
                                    }

                                }
                            }
                        });
                    }
                });
            }
        });
        $("#barcode_string").val('');
        angular.element(jQuery('#barcode_string')).triggerHandler('input');
        return item;
    };

    $scope.checkProductInList = function(list,productID){
        var data = false;
        angular.forEach(list,function(product){
            if(productID == product.productId){
               data = true;
            }
        });
        return data;
    };

    $scope.checkLOtInList = function(list,lotcode){
        var data = false;
        angular.forEach(list,function(product){
            if(lotcode == product.lotCode){
               data = true;
            }
        });
        return data;
    };

    //get Maximum number of boxes one can have per product based on amount on store
    $scope.getMaximumBoxes = function(product,quantityOnHand){
        return parseInt(quantityOnHand / (product.packaging.dosespervial * product.packaging.vialsperbox));
    };
    //get Maximum number of lose vials one can have
    $scope.getMaximumLoseVials = function(product,quantityOnHand,boxes){
        var dosesOnBoxes = boxes*product.packaging.dosespervial * product.packaging.vialsperbox;
        var remainingDoses = quantityOnHand - dosesOnBoxes;
        return parseInt(remainingDoses / (product.packaging.dosespervial));
    }
    //display the model for issuing
    $scope.useBarcode = true;
    $scope.showIssueModal=function(facility, type){
        if($scope.useBarcode){
            $scope.facilityToIssue=angular.copy(facility);
            $scope.facilityToIssue.type=type;
            var rightNow = new Date();
            $scope.facilityToIssue.displayIssueDate = (rightNow.getMonth() + 1) + '/' + rightNow.getDate() + '/' +  rightNow.getFullYear();
            $scope.facilityToIssue.issueDate = $scope.formatDate(new Date());
            $scope.issueModal=true;
            $timeout(function(){
                $("#barcode_string").focus();
            });
            if($scope.facilityToIssue.productsToIssueByCategory.length !== 0){
                angular.forEach($scope.facilityToIssue.productsToIssueByCategory,function(lineItem,index){
                    if(lineItem.productCategory === "Vaccine"){
                        $scope.productsInList = angular.copy(lineItem.productsToIssue);
                        $scope.facilityToIssue.productsToIssueByCategory[index] = {};
                        $scope.vaccineIndex = index;
                    }
                });

            }else{
                $scope.productsInList = [];
            }
        }else{
            $scope.facilityToIssue=angular.copy(facility);
            $scope.facilityToIssue.type=type;
            $scope.issueModal=true;
        }



    };

    //a function to format date from the GTIN String
    $scope.formatDate = function (date) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2){ month = '0' + month;}
        if (day.length < 2) { day = '0' + day; }

        return [year, month, day].join('-');
    };
    $scope.closeIssueModal=function(){
        $scope.facilityToIssue=undefined;
        $scope.clearErrorMessages();
        $scope.issueModal=false;
    };
    $scope.resetUnscheduledFacility=function(){
        $scope.UnScheduledFacilityId=undefined;
        $scope.UnScheduledFacility=undefined;
    };
    $scope.showNoProductError=function(){
        $scope.showNoProductErrorMessage=true;
    };
    $scope.showFormError=function(){
        $scope.showFormErrorMessage=true;
    };
    $scope.clearErrorMessages=function(){
        $scope.showFormErrorMessage = false;
        $scope.showNoProductErrorMessage=false;
    };

    $scope.showPODModal=function(facility){
        $scope.podModal=true;
        $scope.facilityPOD=facility;
    };

    $scope.closePODModal=function(){
        $scope.podModal=false;
        $scope.facilityPOD=undefined;
    };

    $scope.print = function(distributionId){
        var url = '/vaccine/orderRequisition/issue/print/'+distributionId;
        $window.open(url, '_blank');
    };

    $scope.loadRights = function () {
        $scope.rights = localStorageService.get(localStorageKeys.RIGHT);
    }();

    $scope.hasPermission = function (permission) {
        if ($scope.rights !== undefined && $scope.rights !== null) {
            var rights = JSON.parse($scope.rights);
            var rightNames = _.pluck(rights, 'name');
            return rightNames.indexOf(permission) > -1;
        }
        return false;
    };

    $scope.cancel=function(){
        $window.location='/public/pages/vaccine/inventory/dashboard/index.html#/stock-on-hand';
    };

    $scope.setSelectedFacility=function(facility)
    {
        if(facility)
        {
            $scope.selectedFacilityId=facility.id;
        }
        else
        {
            $scope.selectedFacilityId=null;
        }

    };

    $scope.getSelectedFacilityColor = function (facility) {
        if(facility !== undefined)
        {
            if (!$scope.selectedFacilityId) {
                return 'none';
            }

            if ($scope.selectedFacilityId== facility.id) {
                return "background-color :#dff0d8; color: white !important";
            }
            else {
                return 'none';
            }
        }

    };
    $scope.loadUnScheduledFacilities=function(){
        $scope.UnScheduledFacilities=_.where($scope.allUnScheduledFacilities,{name:$scope.facilityQuery});
    };
    $scope.hasProductToIssue=function(facility)
    {
        var hasAtLeastOne=false;
        var hasError=false;

        if(facility !==undefined && facility.productsToIssue !== undefined)
        {
            facility.productsToIssue.forEach(function(p)
            {
                if(p.quantity >0 )
                {
                    hasAtLeastOne=true;
                }
                if(p.quantity >0 && p.quantityOnHand < p.quantity)
                {
                    hasError=true;
                }
            });
            return (hasAtLeastOne && !hasError);
        }

    };
    $scope.updateCurrentScheduledFacilities = function () {
        $scope.allScheduledFacilities = [];
        $scope.query = $scope.query.trim();

        if (!$scope.query.length) {
            $scope.allScheduledFacilities = $scope.allScheduledFacilitiesCopy;
            //$scope.page();
            return;
        }

        $($scope.allScheduledFacilitiesCopy).each(function (index, facility) {
            var searchString = $scope.query.toLowerCase();
            if (facility.name.toLowerCase().indexOf(searchString) >= 0) {
                $scope.allScheduledFacilities.push(facility);
            }
        });
        //  $scope.page();
    };
    $scope.saveAll=function(){
        $scope.allScheduledFacilities.forEach(function(facility){
            if($scope.hasProductToIssue(facility) && facility.status !== "PENDING"){
                $scope.showIssueModal(facility,"SCHEDULED");
            }
        });
    };
    $scope.showMessages=function(){
        $scope.message=true;
        $scope.selectedRoutineFacility = null;
        $scope.routineFacility=false;
    };

}
BarcodeMassDistributionController.resolve = {

    homeFacility: function ($q, $timeout,UserFacilityList) {
        var deferred = $q.defer();
        var homeFacility={};

        $timeout(function () {
            UserFacilityList.get({}, function (data) {
                homeFacility = data.facilityList[0];
                deferred.resolve(homeFacility);
            });

        }, 100);
        return deferred.promise;
    },
    configurations:function($q, $timeout, AllVaccineInventoryConfigurations) {
        var deferred = $q.defer();
        var configurations={};
        $timeout(function () {
            AllVaccineInventoryConfigurations.get(function(data)
            {
                configurations=data;
                deferred.resolve(configurations);
            });
        }, 100);
        return deferred.promise;
    }
};