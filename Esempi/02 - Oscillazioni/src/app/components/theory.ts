import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Spiegazione teorica di flapping, isteresi e cool-down, con i riferimenti ai cloud reali. */
@Component({
  selector: 'app-theory',
  templateUrl: './theory.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Theory {
  protected readonly hpaExample = `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web
  minReplicas: 1
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0      # reagisce subito ai picchi
      policies:
        - type: Pods
          value: 2
          periodSeconds: 60              # al massimo +2 pod al minuto
    scaleDown:
      stabilizationWindowSeconds: 300    # "cool-down": 5 minuti prima di ridurre
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60`;
}
