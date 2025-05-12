import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'orderByName' })
export class OrderByNamePipe implements PipeTransform {
  transform(users: any[]): any[] {
    return [...users].sort((a, b) => a.name.localeCompare(b.name));
  }
}
