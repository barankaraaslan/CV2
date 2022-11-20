import {
  CfnOutput,
  DockerImage,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Distribution } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { join } from "path";

export class BuilderImageStack extends Stack {
  readonly imageAsset: DockerImageAsset;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.imageAsset = new DockerImageAsset(this, "cv-builder-2", {
      directory: join(__dirname, "../"),
    });
  }
}

export interface Cv2StackProps extends StackProps {
  imageAsset: DockerImageAsset;
}

export class Cv2Stack extends Stack {
  constructor(scope: Construct, id: string, props: Cv2StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "bucket", {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      bucketName: "cv-repo",
      enforceSSL: true,
    });

    const cvFileName = "cv.html";

    const domainName = new Distribution(this, "distribution", {
      defaultBehavior: {
        origin: new S3Origin(bucket),
      },
      defaultRootObject: cvFileName,
    }).domainName;

    new CfnOutput(this, "domainName", {
      value: domainName,
    });
    const bundlerImage = DockerImage.fromRegistry(props.imageAsset.imageUri);
    new BucketDeployment(this, "bucket-deployment", {
      destinationBucket: bucket,
      sources: [
        Source.asset(join(__dirname, "../"), {
          bundling: {
            image: bundlerImage,
            command: [
              "bash",
              "-c",
              'echo "heloo" >> /asset-input/cv.html && cp /asset-input/cv.html /asset-output/cv.html',
            ],
          },
        }),
      ],
    });
  }
}
