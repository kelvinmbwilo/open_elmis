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

function BarcodeBaSaveIssueController($scope,$location, $window,$timeout,StockEvent,SaveDistribution) {

    $scope.distribute=function(){
        $scope.allProductsZero=true;
        $scope.clearErrorMessages();
        var printWindow;
        $scope.facilityToIssue.productsToIssueByCategory.forEach(function(category){
            category.productsToIssue.forEach(function(product){
                if(product.quantity > 0)
                {
                    $scope.allProductsZero=false;
                }
            });

        });
        if($scope.issueForm.$invalid)
        {
            console.log(JSON.stringify($scope.issueForm));
            $scope.showFormError();
            return;
        }
        if($scope.allProductsZero){
            $scope.showNoProductError();
            return;
        }


        var distribution = {};
        var events = [];

        distribution.fromFacilityId = $scope.homeFacility.id;
        distribution.toFacilityId= $scope.facilityToIssue.id;
        distribution.programId=$scope.selectedProgram.id;
        distribution.distributionDate = $scope.facilityToIssue.issueDate;
        distribution.lineItems=[];
        distribution.distributionType=$scope.facilityToIssue.type;
        distribution.status="PENDING";

        var distribution1 = angular.copy(distribution);
        $scope.facilityToIssue.productsToIssueByCategory.forEach(function(category){

            category.productsToIssue.forEach(function(product){
                if(product.quantity >0)
                {
                    var list = {};
                    var list1 = {};
                    list.productId = product.productId;
                    list.quantity=product.quantity;
                    list1.quantity=product.quantity;
                    list1.productId = product.productId;
                    list1.productName = product.name;
                    if(product.lots !==undefined && product.lots.length >0)
                    {
                        list.lots = [];
                        list1.lots = [];
                        product.lots.forEach(function(l)
                        {
                            if(l.quantity !==null && l.quantity >0)
                            {
                                var lot = {};
                                var lot1 = {};
                                var event ={};
                                event.type="ISSUE";
                                event.productCode =product.productCode;
                                event.facilityId=$scope.facilityToIssue.id;
                                event.occurred=$scope.facilityToIssue.issueDate;
                                event.customProps={};
                                event.customProps.occurred=$scope.facilityToIssue.issueDate;
                                event.customProps.issuedto=$scope.facilityToIssue.name;
                                event.lotId=l.lotId;
                                event.quantity=l.quantity;

                                lot.lotId = l.lotId;
                                lot.vvmStatus=l.vvmStatus;
                                lot.quantity = l.quantity;

                                lot1.lotId = l.lotId;
                                lot1.vvmStatus=l.vvmStatus;
                                lot1.quantity = l.quantity;
                                lot1.expireDate = l.expirationDate;
                                lot1.lotCode = l.lotCode;
                                lot1.productName = product.name;

                                list.lots.push(lot);
                                list1.lots.push(lot1);
                                events.push(event);
                            }

                        });
                    }
                    else{
                        var event ={};
                        event.type="ISSUE";
                        event.productCode =product.productCode;
                        event.facilityId=$scope.facilityToIssue.id;
                        event.occurred=$scope.facilityToIssue.issueDate;
                        event.customProps={};
                        event.customProps.occurred=$scope.facilityToIssue.issueDate;
                        event.customProps.issuedto=$scope.facilityToIssue.name;
                        event.quantity=product.quantity;
                        events.push(event);
                    }
                    distribution.lineItems.push(list);
                    distribution1.lineItems.push(list1);
                }
            });
        });

        $scope.data.finalDistribution = angular.copy(distribution1);
        $scope.data.finalDistribution.facilityName = $scope.facilityToIssue.name;
        console.log("distribution",$scope.data.finalDistribution);


        StockEvent.save({facilityId:$scope.homeFacility.id},events, function (data) {
            if(data.success)
            {
                SaveDistribution.save(distribution,function(distribution){
                    $scope.showMessages();
                    $scope.closeIssueModal();
                    $scope.distributionId=distribution.distributionId.id;
                    $scope.data.finalDistribution.voucherNumber = distribution.distributionId.voucherNumber;
                    var url = '/vaccine/orderRequisition/issue/print/'+$scope.distributionId;
                    $scope.data.showReport = true;
                    //html2canvas(document.getElementById('exportthis'), {
                    //    onrendered: function (canvas) {
                    //        var data = canvas.toDataURL();
                    //        var docDefinition = {
                    //            content: [{
                    //                image: data,
                    //                width: 1100,
                    //            }]
                    //        };
                    //        pdfMake.createPdf(docDefinition).download(distribution.distributionId.voucherNumber +".pdf");
                    //    }
                    //});
                    //printWindow.location.href=url;
                });
            }
        });
        //printWindow= $window.open('about:blank','_blank');

    };

}