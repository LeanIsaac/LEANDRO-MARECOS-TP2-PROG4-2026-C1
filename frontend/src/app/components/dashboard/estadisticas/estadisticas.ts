// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-estadisticas',
//   imports: [],
//   templateUrl: './estadisticas.html',
//   styleUrl: './estadisticas.css',
// })
// export class Estadisticas {}
import { Component, inject, signal, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface MetricData {
  label: string;
  value: number;
}

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './estadisticas.html',
})
export class Estadisticas implements OnInit {
  private http = inject(HttpClient);
  private apiBase = `${environment.apiUrl}/publicaciones/estadisticas`;

  // Inicializamos las fechas por defecto: desde hace 30 días hasta hoy
  fechaInicio = signal<string>(this.obtenerFechaPasada(30));
  fechaFin = signal<string>(this.obtenerFechaActual());
  loading = signal(false);

  // Referencias a los lienzos HTML Canvas para inyectar Chart.js
  @ViewChild('chartBars') chartBarsRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartLines') chartLinesRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartPie') chartPieRef!: ElementRef<HTMLCanvasElement>;

  private instanciasCharts: Chart[] = [];

  ngOnInit(): void {
    // La primera carga ocurre automáticamente tras la inicialización visual
  }

  ngAfterViewInit(): void {
    this.consultarMetricas();
  }

  async consultarMetricas(): Promise<void> {
    this.loading.set(true);
    // Limpiamos instancias viejas si el usuario cambia el rango de fechas para evitar solapamientos visuales
    this.instanciasCharts.forEach(c => c.destroy());
    this.instanciasCharts = [];

    const urlParams = `?inicio=${this.fechaInicio()}&fin=${this.fechaFin()}`;

    try {
      const [resBars, resLines, resPie] = await Promise.all([
        firstValueFrom(this.http.get<MetricData[]>(`${this.apiBase}/publicaciones-por-usuario${urlParams}`)),
        firstValueFrom(this.http.get<MetricData[]>(`${this.apiBase}/comentarios-totales${urlParams}`)),
        firstValueFrom(this.http.get<MetricData[]>(`${this.apiBase}/comentarios-por-publicacion${urlParams}`))
      ]);

      this.renderizarGraficoBarras(resBars);
      this.renderizarGraficoLineas(resLines);
      this.renderizarGraficoTorta(resPie);

    } catch (err) {
      console.error('Error al procesar métricas:', err);
    } finally {
      this.loading.set(false);
    }
  }

  // 1: GRÁFICO DE BARRAS (Publicaciones por usuario)
  private renderizarGraficoBarras(data: MetricData[]): void {
    const ctx = this.chartBarsRef.nativeElement.getContext('2d')!;
    const c = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [{ label: 'Posteos realizados', data: data.map(d => d.value), backgroundColor: '#ea580c', borderRadius: 6 }]
      },
      options: this.obtenerOpcionesGraficos()
    });
    this.instanciasCharts.push(c);
  }

  // 2: GRÁFICO DE LÍNEAS (Evolución de comentarios por día)
  private renderizarGraficoLineas(data: MetricData[]): void {
    const ctx = this.chartLinesRef.nativeElement.getContext('2d')!;
    const c = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.label),
        datasets: [{ label: 'Comentarios creados', data: data.map(d => d.value), borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)', fill: true, tension: 0.3 }]
      },
      options: this.obtenerOpcionesGraficos()
    });
    this.instanciasCharts.push(c);
  }

  // 3: GRÁFICO DE TORTA / PIE (Distribución de comentarios por post)
  private renderizarGraficoTorta(data: MetricData[]): void {
    const ctx = this.chartPieRef.nativeElement.getContext('2d')!;
    const c = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: data.map(d => d.label),
        datasets: [{ data: data.map(d => d.value), backgroundColor: ['#ea580c', '#f97316', '#fdba74', '#27272a', '#3f3f46', '#52525b'] }]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#d4d4d8', font: { family: 'monospace', size: 10 } } } }
      }
    });
    this.instanciasCharts.push(c);
  }

  private obtenerOpcionesGraficos() {
    return {
      responsive: true,
      scales: {
        x: { ticks: { color: '#71717a' }, grid: { display: false } },
        y: { ticks: { color: '#71717a', stepSize: 1 }, grid: { color: '#18181b' } }
      },
      plugins: { legend: { display: false } }
    };
  }

  private obtenerFechaActual(): string {
    return new Date().toISOString().split('T')[0];
  }

  private obtenerFechaPasada(dias: number): string {
    const date = new Date();
    date.setDate(date.getDate() - dias);
    return date.toISOString().split('T')[0];
  }
}
