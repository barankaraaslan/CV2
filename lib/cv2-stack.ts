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

export class Cv2Stack extends Stack {
  readonly domainName: string;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "bucket", {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      bucketName: "cv-repo",
      enforceSSL: true,
    });

    const cvFileName = "cv.html";

    const image = new DockerImageAsset(this, "cv-builder-image", {
      directory: join(__dirname, "../"),
    });

    new BucketDeployment(this, "bucket-deployment", {
      destinationBucket: bucket,
      sources: [
        Source.asset(join(__dirname, "../"), {
          bundling: {
            image: DockerImage.fromRegistry(
              "872456077798.dkr.ecr.eu-central-1.amazonaws.com/cdk-hnb659fds-container-assets-872456077798-eu-central-1:b3a127d0ecdcac467dcf900a9ada0a3843728f7d04ee0365d7584494918f9508"
            ),
            command: [
              "bash",
              "-c",
              'echo "heloo" >> /asset-input/cv.html && cp /asset-input/cv.html /asset-output/cv.html',
            ],
          },
        }),
      ],
    });
    this.domainName = new Distribution(this, "distribution", {
      defaultBehavior: {
        origin: new S3Origin(bucket),
      },
      defaultRootObject: cvFileName,
    }).domainName;

    new CfnOutput(this, "domainName", {
      value: this.domainName,
    });
    new CfnOutput(this, "imageuri", {
      value: image.imageUri,
    });
  }
}
