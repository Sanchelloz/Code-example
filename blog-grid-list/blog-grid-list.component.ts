import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';

import {BlogInterface} from 'src/app/blog/interfaces/blog-interface';
import {blogAnimations as animations} from 'src/app/blog/common/animations';
import {BlogService} from 'src/app/blog/services/blog.service';
import {LoadingService} from 'src/app/shared/components/loading/loading.service';
import {AuthService, AuthType} from 'src/app/shared/services/auth.service';

@Component({
  selector: 'xcdrs-blog-grid-list',
  templateUrl: './blog-grid-list.component.html',
  styleUrls: ['./blog-grid-list.component.scss'],
  animations: [
    animations.fadeInAnimation
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogGridListComponent implements OnInit {
  @Input() blogs$: Observable<BlogInterface[]>;
  loadBlogs$: Observable<BlogInterface[]>;

  constructor(
    private blogService: BlogService,
    private loadingService: LoadingService,
    private authService: AuthService
  ) {
  }

  ngOnInit(): void {
    this.initValues();
  }

  private initValues(): void {
    this.blogs$ = this.authService.getAddonsAuth(this.authService.idenediGroupId).pipe(
      map(addons => {
        return addons.filter(
          addon => addon.Type === AuthType.Technadopt)[0];
      }),
      switchMap((addon) => {
        return this.blogService.getBlogs({
          filterAccessListIds: addon.OrganziationId || ''
        });
      })
    )
    this.loadBlogs$ = this.loadingService.showLoaderUntilCompleted(this.blogs$);
  }

  trackById(index: number, item: BlogInterface): string {
    return item.BlogId;
  }

}
