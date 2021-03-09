import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Platform} from '@angular/cdk/platform';
import {MatTabChangeEvent} from "@angular/material/tabs";
import {Subject} from 'rxjs';
import {Observable} from "rxjs/internal/Observable";
import {map, takeUntil, tap} from 'rxjs/operators';

import {ProductsService} from 'src/app/products/products.service';
import {
  Provider,
  SearchProduct,
  TopicType
} from 'src/app/products/interfaces';
import {ProductDataSource} from 'src/app/products/product-data-source';
import {ProductsToolbarComponent} from "src/app/products/products-toolbar/products-toolbar.component";
import {ProductsDisplayMode} from 'src/app/products/products-display-mode-btn/products-display-mode-btn.component';
import {LoadingService} from 'src/app/shared/components/loading/loading.service';
import {AuthService, AuthType} from 'src/app/shared/services/auth.service';

const GRID_LIMIT = 21;
const TABLE_LIMIT = 9;

@Component({
  selector: 'xcdrs-products-main',
  templateUrl: './products-main.component.html',
  styleUrls: ['./products-main.component.scss']
})
export class ProductsMainComponent implements OnInit, OnDestroy {
  @ViewChild(
    'productsToolbarComponent') productsToolbar: ProductsToolbarComponent
  dataSource: ProductDataSource;
  providers: Provider[] = [];
  categoryTypes$: Observable<TopicType[]>
  search: SearchProduct = {
    searchTerm: '',
    categories: [],
    providers: [],
    start: 0,
    limit: TABLE_LIMIT,
    isAdminCall: false
  };
  organizationId: string
  mode: ProductsDisplayMode;
  ProductsDisplayMode = ProductsDisplayMode;
  isMobilePlatform = false;
  isAdmin = false
  isAuthenticated = false
  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    private productsService: ProductsService,
    private loadingService: LoadingService,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private platform: Platform
  ) {
  }

  ngOnInit(): void {
    this.initValues();
    this.onDataLoading();
  }

  initValues(): void {
    this.initVariables();
    this.setDisplayMode(ProductsDisplayMode.Grid);
  }

  initVariables(): void {
    this.isAuthenticated = this.authService.isLoggedIn();
    this.dataSource = new ProductDataSource(this.productsService);
    this.isMobilePlatform = this.platform.ANDROID || this.platform.IOS;
    const searchParam = this.activatedRoute.snapshot.queryParams['search'];
    const categoryParam = this.activatedRoute.snapshot.queryParams['category'];
    if (searchParam) {
      this.search.searchTerm = searchParam;
    }
    if (categoryParam) {
      this.search.categories = [categoryParam];
    }
  }

  setDisplayMode(mode: ProductsDisplayMode): void {
    if (this.mode === mode) {
      return;
    }
    this.mode = mode;
    this.search.limit =
      mode === ProductsDisplayMode.Grid ? GRID_LIMIT : TABLE_LIMIT;
    this.search = Object.assign(this.search, {start: 0});
    this.loadProducts();
  }

  loadProducts(): void {
    this.authService.getAddonsAuth(this.authService.idenediGroupId).pipe(
      takeUntil(this.destroy$),
      map(addons => {
        return addons.filter(
          addon => addon.Type === AuthType.Technadopt)[0];
      }),
      tap((addon) => {
        if (addon.OrganziationId) {
          this.organizationId = addon.OrganziationId
          this.categoryTypes$ = this.productsService.getProductTypes(
            {organziationId: addon.OrganziationId})
            .pipe(map(types => types.filter(type => type?.ShowAsSegment)))

          this.search.organziationId = addon.OrganziationId;
        }
        if (addon.technadoptAuthData?.roles &&
          addon.technadoptAuthData?.roles.indexOf('Exceed Admin') != -1) {
          this.isAdmin = true
        } else {
          this.isAdmin = false
        }
        this.dataSource.loadProducts(this.search);
      })
    ).subscribe();
  }

  onDataLoading(): void {
    this.dataSource.loading$.pipe(takeUntil(this.destroy$))
      .subscribe(isLoading => {
        if (isLoading) {
          this.loadingService.loadingOn();
        } else {
          this.loadingService.loadingOff();
        }
      });
  }

  onSearch(searchObj: { categories: string[]; providers: string[], searchTerm: string }): void {
    this.search = Object.assign({}, this.search, {start: 0});
    this.search.providers = searchObj.providers || []
    this.search.categories = searchObj.categories || []
    this.search.searchTerm = searchObj.searchTerm || ''
    this.dataSource.loadProducts(this.search);
  }

  onProductAdd() {
    this.router.navigateByUrl('/pages/products/add/new')
  }

  onTabChange($event: MatTabChangeEvent): void {
    this.productsToolbar.resetFilters()
    if ($event.tab.textLabel === 'All Products') {
      // all products
      this.search = {
        isAdminCall: false,
        activeOnly: true,
        start: 0,
        limit: GRID_LIMIT,
        organziationId: this.organizationId
      }
    } else if ($event.tab.textLabel === 'My Products') {
      // own products
      this.search = {
        isAdminCall: true,
        activeOnly: false,
        start: 0,
        limit: GRID_LIMIT,
        organziationId: this.organizationId
      }
    } else if ($event.tab.ariaLabelledby) {
      // topic category
      this.search = {
        isAdminCall: false,
        activeOnly: true,
        start: 0,
        limit: GRID_LIMIT,
        organziationId: this.organizationId,
        TopicTypeId: $event.tab.ariaLabelledby
      }
    }
    this.dataSource.loadProducts(this.search)
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
