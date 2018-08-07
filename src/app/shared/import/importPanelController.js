app.controller('importPanelController', ['$scope', '$log', '$mdDialog', 'getFolderService','folderBreadcrumbService', function ($scope, $log, $mdDialog, getFolderService,folderBreadcrumbService) {


    var self = this;
   
    

    $scope.activePage = [];


    $scope.breadcrumb = [];

    self.getBreadCrumb = function(){
        $scope.breadcrumb = folderBreadcrumbService.getPath();
    
    }

    
    self.getComponents = function (folderId) {
        getFolderService.getFolder(folderId).then(function (result) {
            $scope.activePage = result;
            rootfolderId = result.id;
            $scope.$apply();
        })
    }

    $scope.componentClick = function (component) {
        if (component.type === 'folder') {
            self.getComponents(component.id);
        }
    }



    $scope.cancel = function () {
        $mdDialog.cancel();
        folderBreadcrumbService.home();
    };

    $scope.previewChange = function () {
        $scope.preview = !$scope.preview;
       
    }
    $scope.preview = false;


    self.getComponents();
    self.getBreadCrumb();


}])